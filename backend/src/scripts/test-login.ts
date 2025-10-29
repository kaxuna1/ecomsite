const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kaxgel11@gmail.com',
        password: 'GVA@edw0fke6urq8wer'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
    } else {
      console.log('\n❌ Login failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testLogin();
