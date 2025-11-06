// Quick SendPulse API test
async function testSendPulse() {
  const userId = '2ddf80913d1cc0a741ae6d58814ecfc5';
  const secret = 'a5d000d40019af863a62b48f2500ffc7';
  
  console.log('🔍 Testing SendPulse credentials...');
  console.log('User ID:', userId);
  console.log('Secret:', secret.substring(0, 5) + '...');
  
  try {
    const response = await fetch("https://api.sendpulse.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: userId,
        client_secret: secret,
      }),
    });

    const data = await response.json();
    
    console.log('\n📡 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.access_token) {
      console.log('\n✅ SUCCESS! Access token obtained.');
      console.log('Token expires in:', data.expires_in, 'seconds');
      return true;
    } else {
      console.log('\n❌ FAILED! No access token received.');
      console.log('Error:', data.error || 'Unknown error');
      console.log('Error Description:', data.error_description || 'No description');
      return false;
    }
  } catch (error) {
    console.error('\n💥 ERROR during API call:', error.message);
    return false;
  }
}

testSendPulse();
