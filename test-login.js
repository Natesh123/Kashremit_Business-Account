const axios = require('axios');
const payload = {
  request: {
    Authenticate: { Email: "nateshkumar1406@gmail.com", Password: "wrongpassword123" },
    Login: "KashRemit",
    Password: "D91880531DC2628EF6D98799641CCE9479326B88D0F37D5269F0715DB61AD97A4CB5F802B1EB97BE98AD924E374119FD5E6E712B4DA4324E6EF9B018F22B5700",
    ClientCredentials: {
      Login: "KashRemit",
      Password: "D91880531DC2628EF6D98799641CCE9479326B88D0F37D5269F0715DB61AD97A4CB5F802B1EB97BE98AD924E374119FD5E6E712B4DA4324E6EF9B018F22B5700",
      ChannelType: "02",
      control: null,
      AuthenticationAgentCode: null,
      TokenID: null
    },
    DeviceInformation: { DeviceID: null, DeviceName: "MOBILE", DeviceIP: "ipAddress", OS: "android", MobileNumber: null }
  }
};
axios.post('https://servicetokdev.kashremit.com/CashUIMR.svc/api/RemitterLogin', payload, {
  headers: { 'Content-Type': 'application/json' }
})
  .then(res => console.log('SUCCESS:', res.status, res.data))
  .catch(err => console.error('ERROR:', err.response ? err.response.status : err.message, err.response ? err.response.data : ''));
