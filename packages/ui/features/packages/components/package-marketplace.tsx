import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ExternalLink, PackageOpen, Search, ShieldAlert, X } from 'lucide-react-native';
import { usePiClient } from '@pideck/client-sdk';
import type { MarketplacePackage } from '@pideck/client-sdk';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORIES = ['all', 'Extension', 'Skill', 'Prompt', 'Theme'];

export function PackageMarketplace() {
  const client = usePiClient();
  const dark = (useColorScheme() ?? 'light') === 'dark';
  const colors = dark ? Colors.dark : Colors.light;
  const accentBackground = dark ? '#D97706' : colors.tint;
  const accentForeground = dark ? '#161616' : '#FFFFFF';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<MarketplacePackage[]>([]);
  const [selected, setSelected] = useState<MarketplacePackage | null>(null);
  const [scope, setScope] = useState<'global' | 'project'>('global');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [installed, setInstalled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await client.api.marketplaceSearch({ query, category, limit: 30 });
      setItems(result.packages);
    } catch (error) { setMessage(error instanceof Error ? error.message : '加载插件失败'); }
    finally { setLoading(false); }
  }, [client, query, category]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!selected || selected.readme !== undefined) return;
    void client.api.marketplaceDetail(selected.name).then(setSelected).catch(() => {});
  }, [client, selected]);

  const showInstalled = async () => {
    setInstalled(true);
    try {
      const result = await client.api.marketplaceInstalled();
      setMessage(result.output || '暂无已安装插件');
    } catch (error) { setMessage(error instanceof Error ? error.message : '读取已安装插件失败'); }
  };

  const install = async () => {
    if (!selected) return;
    const target = version.trim() || selected.version;
    const command = `pi install npm:${selected.name}@${target}${scope === 'project' ? ' --local' : ''}`;
    const confirmed = await new Promise<boolean>((resolve) => {
      if (typeof window !== 'undefined' && window.confirm) {
        resolve(window.confirm(`该插件拥有完整系统权限。\n\n来源：${selected.repository ?? selected.npm_url}\n资源类型：${selected.package_types.join(', ')}\n将执行：${command}\n\n继续安装？`));
      } else {
        Alert.alert('安装安全提示', `插件拥有完整系统权限。\n来源：${selected.repository ?? selected.npm_url}\n将执行：${command}`, [{ text: '取消', style: 'cancel', onPress: () => resolve(false) }, { text: '继续', style: 'destructive', onPress: () => resolve(true) }]);
      }
    });
    if (!confirmed) return;
    setMessage('正在安装…');
    try {
      const result = await client.api.marketplaceOperation({ operation: 'install', name: selected.name, version: target, scope, lock_version: true, workspace_id: null });
      setMessage(result.output || '安装完成');
    } catch (error) { setMessage(error instanceof Error ? error.message : '安装失败'); }
  };

  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <View style={styles.header}><View><Text style={[styles.title, { color: colors.text }]}>插件广场</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>从npm Registry发现可信的Pi插件包</Text></View><View style={styles.headerActions}><Pressable onPress={() => { setInstalled(false); void load(); }}><Text style={{ color: !installed ? colors.tint : colors.textSecondary }}>发现</Text></Pressable><Pressable onPress={showInstalled}><Text style={{ color: installed ? colors.tint : colors.textSecondary }}>已安装</Text></Pressable><PackageOpen size={28} color={colors.tint} /></View></View>
    <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surface }]}><Search size={18} color={colors.textTertiary} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={load} placeholder="搜索插件名称或关键词" placeholderTextColor={colors.textTertiary} style={[styles.input, { color: colors.text }]} returnKeyType="search" /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {CATEGORIES.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { borderColor: colors.border }, category === item && { backgroundColor: accentBackground, borderColor: accentBackground }]}><Text style={{ color: category === item ? accentForeground : colors.textSecondary }}>{item === 'all' ? '全部' : item}</Text></Pressable>)}
    </ScrollView>
    {message ? <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>{message}</Text> : null}
    <ScrollView contentContainerStyle={styles.grid}>{loading ? <Text style={{ color: colors.textSecondary }}>加载中…</Text> : items.map((item) => <Pressable key={item.name} onPress={() => { setSelected(item); setVersion(item.version); }} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cardTop}><Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text><Text style={[styles.version, { color: colors.textTertiary }]}>v{item.version}</Text></View><Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{item.description || '作者未提供介绍'}</Text><View style={styles.cardBottom}><Text style={[styles.meta, { color: colors.textTertiary }]}>{item.package_types.join(' · ')}</Text><Text style={[styles.meta, { color: colors.textTertiary }]}>{item.downloads ? `${item.downloads.toLocaleString()} weekly` : 'npm'}</Text></View></Pressable>)}</ScrollView>
    {selected ? <View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{selected.name}</Text><Pressable onPress={() => setSelected(null)}><X size={22} color={colors.textSecondary} /></Pressable></View><Text style={[styles.description, { color: colors.textSecondary }]}>{selected.description || '作者未提供介绍'}</Text><Text style={[styles.detail, { color: colors.textSecondary }]}>类型：{selected.package_types.join('、')}  ·  当前版本：{selected.version}</Text><View style={styles.scopeRow}>{(['global', 'project'] as const).map((value) => <Pressable key={value} onPress={() => setScope(value)} style={[styles.scope, { borderColor: colors.border }, scope === value && { backgroundColor: colors.tint, borderColor: colors.tint }]}><Text style={{ color: scope === value ? '#fff' : colors.text }}>{value === 'global' ? '全局安装' : '项目安装'}</Text></Pressable>)}</View><TextInput value={version} onChangeText={setVersion} placeholder="版本（默认最新）" placeholderTextColor={colors.textTertiary} style={[styles.versionInput, { color: colors.text, borderColor: colors.border }]} /><View style={styles.warning}><ShieldAlert size={18} color="#D97706" /><Text style={styles.warningText}>插件拥有完整系统权限，请确认来源和资源类型后安装。</Text></View><Pressable onPress={install} style={[styles.install, { backgroundColor: colors.tint }]}><Text style={styles.installText}>确认安装</Text></Pressable>{selected.repository ? <Pressable onPress={() => Linking.openURL(selected.repository!)} style={styles.link}><ExternalLink size={15} color={colors.tint} /><Text style={{ color: colors.tint }}>打开仓库</Text></Pressable> : null}{selected.readme ? <ScrollView style={styles.readme}><Text style={[styles.readmeText, { color: colors.textSecondary }]}>{selected.readme}</Text></ScrollView> : null}</View> : null}
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, padding: 28, maxWidth: 1120, width: '100%', alignSelf: 'center' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 }, title: { fontFamily: Fonts.sansSemiBold, fontSize: 28 }, subtitle: { marginTop: 6, fontSize: 14 }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 }, input: { flex: 1, height: 46, fontSize: 15 }, chips: { gap: 8, paddingVertical: 16 }, chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 }, message: { marginBottom: 10 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 80 }, card: { width: 300, minHeight: 132, borderWidth: 1, borderRadius: 14, padding: 16 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, name: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 16 }, version: { fontFamily: Fonts.mono, fontSize: 12 }, description: { marginTop: 10, lineHeight: 20, fontSize: 14 }, cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }, meta: { fontSize: 12 }, modal: { position: 'absolute', right: 20, top: 20, bottom: 20, width: 390, borderWidth: 1, borderRadius: 18, padding: 22, shadowColor: '#000', shadowOpacity: .2, shadowRadius: 18, elevation: 8 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, modalTitle: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 20 }, detail: { marginTop: 14, fontSize: 13 }, scopeRow: { flexDirection: 'row', gap: 8, marginTop: 18 }, scope: { borderWidth: 1, borderRadius: 8, padding: 9 }, versionInput: { borderWidth: 1, borderRadius: 8, height: 42, paddingHorizontal: 12, marginTop: 12 }, warning: { flexDirection: 'row', gap: 8, marginTop: 16, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 8 }, warningText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 17 }, install: { borderRadius: 9, alignItems: 'center', paddingVertical: 12, marginTop: 16 }, installText: { color: '#fff', fontFamily: Fonts.sansSemiBold }, link: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, readme: { marginTop: 18 }, readmeText: { fontSize: 13, lineHeight: 19 } });
