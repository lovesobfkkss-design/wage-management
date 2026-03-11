'use strict';

function json(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function normalizePhoneNumber(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function validateEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    return json(response, 405, { success: false, message: 'Method not allowed.' });
  }

  try {
    const userId = validateEnv('ALIGO_USER_ID');
    const apiKey = validateEnv('ALIGO_API_KEY');
    const sender = normalizePhoneNumber(process.env.ALIGO_SENDER);
    const receiver = normalizePhoneNumber(request.body?.receiver);
    const msg = String(request.body?.msg || '').trim();
    const title = String(request.body?.title || '').trim();
    const testMode = request.body?.testMode === true ? 'Y' : 'N';

    if (!sender) {
      throw new Error('Missing environment variable: ALIGO_SENDER');
    }

    if (!receiver) {
      return json(response, 400, { success: false, message: 'Missing receiver.' });
    }

    if (!msg) {
      return json(response, 400, { success: false, message: 'Missing msg.' });
    }

    const formData = new URLSearchParams();
    formData.set('key', apiKey);
    formData.set('user_id', userId);
    formData.set('sender', sender);
    formData.set('receiver', receiver);
    formData.set('msg', msg);
    formData.set('title', title || '급여 안내');
    formData.set('testmode_yn', testMode);

    const aligoResponse = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: formData.toString()
    });

    const result = await aligoResponse.json();

    if (!aligoResponse.ok || String(result.result_code) !== '1') {
      return json(response, 400, {
        success: false,
        message: result.message || '알리고 문자 발송 실패',
        resultCode: result.result_code || null
      });
    }

    return json(response, 200, {
      success: true,
      message: result.message || '발송 완료',
      resultCode: result.result_code || null,
      msgId: result.msg_id || null
    });
  } catch (error) {
    return json(response, 500, {
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
