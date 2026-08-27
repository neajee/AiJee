import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SetupScreen() {
  const [form, setForm] = useState({ code: '', username: '', password: '', password_confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Initialization failed');
      const session = payload.data;
      const serverId = session?.server_id;
      if (!serverId || !session.access_token || !session.refresh_token) throw new Error('Local session was not created');
      localStorage.setItem('servers_list', JSON.stringify([{ id: serverId, name: 'PiDeck', address: window.location.origin }]));
      localStorage.setItem('auth_tokens', JSON.stringify({
        [serverId]: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          accessExpiresAt: session.access_expires_at,
          refreshExpiresAt: session.refresh_expires_at,
        },
      }));
      localStorage.setItem('auth_active_server', serverId);
      window.location.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.brand}>PiDeck</Text>
        <Text style={styles.title}>Initialize this device</Text>
        <Text style={styles.help}>Enter the setup code shown in the server terminal.</Text>
        <TextInput style={styles.input} placeholder="Setup code" autoCapitalize="characters" value={form.code} onChangeText={update('code')} />
        <TextInput style={styles.input} placeholder="Administrator username" autoCapitalize="none" value={form.username} onChangeText={update('username')} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={update('password')} />
        <TextInput style={styles.input} placeholder="Repeat password" secureTextEntry value={form.password_confirm} onChangeText={update('password_confirm')} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, loading && styles.disabled]} disabled={loading} onPress={submit}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Initialize PiDeck</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0b0d10' },
  card: { width: '100%', maxWidth: 440, gap: 14, padding: 32, borderRadius: 18, backgroundColor: '#171a1f', borderWidth: 1, borderColor: '#2a2f37' },
  brand: { color: '#70a5ff', fontSize: 16, fontWeight: '700' },
  title: { color: '#f5f7fa', fontSize: 28, fontWeight: '700' },
  help: { color: '#9ba4b0', fontSize: 14, marginBottom: 6 },
  input: { height: 48, paddingHorizontal: 14, borderRadius: 10, color: '#f5f7fa', backgroundColor: '#0f1216', borderWidth: 1, borderColor: '#343b46' },
  error: { color: '#ff7b72', fontSize: 13 },
  button: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#3478f6', marginTop: 4 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
