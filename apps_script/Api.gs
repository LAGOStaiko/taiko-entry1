/**
 * Apps Script API Router (Cloudflare Pages Functions에서 호출)
 *
 * ✅ 주의:
 * - 이 파일은 "Apps Script 프로젝트"에 새 파일(Api.gs 등)로 추가해서 쓰세요.
 * - doGet은 기존 프론트용으로 이미 있을 수 있으니 건드리지 않습니다.
 * - doPost만 추가합니다.
 *
 * 필요 Script Properties:
 * - SPREADSHEET_ID  (이미 setupOnce_에서 설정됨)
 * - API_PUBLIC_TOKEN
 * - API_ADMIN_TOKEN
 *
 * Cloudflare Pages Environment variables로 옮길 값:
 * - GAS_WEBAPP_URL   = Apps Script Web App /exec URL
 * - GAS_PUBLIC_TOKEN = API_PUBLIC_TOKEN
 * - GAS_ADMIN_TOKEN  = API_ADMIN_TOKEN
 */

function SETUP_API_TOKENS() {
  var props = PropertiesService.getScriptProperties();

  var pub = props.getProperty('API_PUBLIC_TOKEN');
  if (!pub) {
    pub = 'pub_' + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('API_PUBLIC_TOKEN', pub);
  }

  var adm = props.getProperty('API_ADMIN_TOKEN');
  if (!adm) {
    adm = 'adm_' + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('API_ADMIN_TOKEN', adm);
  }

  Logger.log('API_PUBLIC_TOKEN=' + pub);
  Logger.log('API_ADMIN_TOKEN=' + adm);
  console.log('API_PUBLIC_TOKEN=' + pub);
  console.log('API_ADMIN_TOKEN=' + adm);

  return { API_PUBLIC_TOKEN: pub, API_ADMIN_TOKEN: adm };
}

function GET_API_TOKENS() {
  var props = PropertiesService.getScriptProperties();
  return {
    API_PUBLIC_TOKEN: props.getProperty('API_PUBLIC_TOKEN') || '',
    API_ADMIN_TOKEN: props.getProperty('API_ADMIN_TOKEN') || ''
  };
}

function doPost(e) {
  try {
    var req = {};
    try {
      req = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
    } catch (parseErr) {
      return jsonOut_({ ok: false, message: 'JSON 파싱 실패' });
    }

    var action = String(req.action || '').trim();
    var token = String(req.token || '').trim();
    var payload = req.payload || {};

    var props = PropertiesService.getScriptProperties();
    var publicToken = String(props.getProperty('API_PUBLIC_TOKEN') || '');
    var adminToken = String(props.getProperty('API_ADMIN_TOKEN') || '');

    // 토큰 미설정 시 안내
    if (!publicToken || !adminToken) {
      return jsonOut_({ ok: false, message: 'API 토큰이 설정되지 않았습니다. SETUP_API_TOKENS()를 1회 실행하세요.' });
    }

    function assertToken(expected) {
      if (token !== expected) throw new Error('Unauthorized');
    }

    switch (action) {
      case 'events.public':
        assertToken(publicToken);
        return jsonOut_({ ok: true, events: listEventsPublic() });

      case 'events.admin':
        assertToken(adminToken);
        return jsonOut_({ ok: true, events: listEventsAll() });

      case 'submit':
        assertToken(publicToken);
        // submitApplication은 {ok:true/false,...}를 반환
        return jsonOut_(submitApplication(payload));

      case 'lookup':
        assertToken(publicToken);
        // lookupApplication은 {ok:true/false,...}를 반환
        return jsonOut_(lookupApplication(payload));

      case 'admin.list':
        assertToken(adminToken);
        return jsonOut_(adminListApplicationsApi_(payload));

      case 'admin.update':
        assertToken(adminToken);
        return jsonOut_(adminUpdateStatusApi_(payload));

      case 'health':
        assertToken(publicToken);
        return jsonOut_({ ok: true, time: nowIso_() });

      default:
        return jsonOut_({ ok: false, message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonOut_({ ok: false, message: String(err && err.message ? err.message : err) });
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 관리자용 list (토큰 기반)
 * - 기존 adminListApplications는 이메일 기반이라 API 호출에 부적합할 수 있어 별도로 둡니다.
 */
function adminListApplicationsApi_(filters) {
  filters = filters || {};

  var apps = sheetObjects_(getSheet_(SHEETS.APPLICATIONS));
  var users = sheetObjects_(getSheet_(SHEETS.USERS));
  var events = sheetObjects_(getSheet_(SHEETS.EVENTS));

  var userById = {};
  users.forEach(function(u){ userById[String(u.user_id).trim()] = u; });

  var eventNameById = {};
  events.forEach(function(ev){
    var id = String(ev.event_id || '').trim();
    if (!id) return;
    eventNameById[id] = String(ev.event_name || id);
  });

  var q = String(filters.q || '').trim().toLowerCase();
  var status = String(filters.status || '').trim();
  var eventId = String(filters.event_id || '').trim();

  var list = apps.map(function(a){
    var u = userById[String(a.user_id).trim()];
    return {
      app_id: a.app_id,
      app_code: a.app_code,
      event_id: a.event_id,
      event_name: eventNameById[String(a.event_id).trim()] || String(a.event_id),
      status: a.status,
      submitted_at: a.submitted_at,
      admin_memo: a.admin_memo || '',
      donder_name: u ? (u.donder_name || '') : '',
      discord: u ? (u.discord || '') : '',
      phone_masked: u ? maskPhone_(u.phone) : '',
      region: u ? (u.region || '') : '',
      controller: u ? (u.controller || '') : ''
    };
  });

  if (eventId) list = list.filter(function(x){ return String(x.event_id) === eventId; });
  if (status) list = list.filter(function(x){ return String(x.status) === status; });
  if (q) {
    list = list.filter(function(x){
      return String(x.app_code || '').toLowerCase().indexOf(q) >= 0 ||
             String(x.donder_name || '').toLowerCase().indexOf(q) >= 0 ||
             String(x.discord || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  list.sort(function(a,b){ return String(b.submitted_at).localeCompare(String(a.submitted_at)); });

  var limit = Math.min(Number(filters.limit || 200), 500);
  var offset = Math.max(Number(filters.offset || 0), 0);

  return { ok: true, total: list.length, items: list.slice(offset, offset + limit) };
}

/**
 * 관리자용 update (토큰 기반)
 */
function adminUpdateStatusApi_(payload) {
  payload = payload || {};
  var appId = String(payload.app_id || '').trim();
  var status = String(payload.status || '').trim();
  var memo = String(payload.admin_memo || '').trim();

  if (!appId) return { ok: false, message: 'app_id가 필요합니다.' };
  if (!status) return { ok: false, message: 'status가 필요합니다.' };

  var sh = getSheet_(SHEETS.APPLICATIONS);
  var rows = sheetObjects_(sh);

  var row = null;
  for (var i=0; i<rows.length; i++) {
    if (String(rows[i].app_id).trim() === appId) { row = rows[i]; break; }
  }
  if (!row) return { ok: false, message: '신청을 찾지 못했습니다.' };

  var before = JSON.stringify(row);

  row.status = status;
  row.admin_memo = memo;
  row.last_updated_by = 'api-admin';

  updateObjectRow_(sh, HEADERS.APPLICATIONS, row.__row, row);
  audit_('api-admin', 'update_status', 'APPLICATIONS', appId, before, JSON.stringify(row));

  return { ok: true };
}
