import { useCallback, useEffect, useRef, useState } from 'react';
import { usePiClient } from '@aijee/client-sdk';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { CATEGORIES, SEARCH_DEBOUNCE_MS, type MarketplaceTab } from '../../utils/marketplace-constants';
import { styles } from '../../utils/marketplace-styles';
import { Segmented, SearchField, Chip, PackageCard } from './controls';
import { InstalledView } from './installed';
import { PackageDetail } from './detail';
import { Notice } from './shared';
export function PackageMarketplace() {
  const client = usePiClient();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const [tab, setTab] = useState<MarketplaceTab>('installed');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<MarketplacePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installedOutput, setInstalledOutput] = useState<string | null>(null);
  const [installedLoading, setInstalledLoading] = useState(false);
  const [installedMessage, setInstalledMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<MarketplacePackage | null>(null);

  // Typing shouldn't fire a request per keystroke, but waiting for Enter hides
  // results from anyone who expects search-as-you-type.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  const search = useCallback(async (searchQuery: string, searchCategory: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.api.marketplaceSearch({
        query: searchQuery,
        category: searchCategory,
        limit: 30
      });
      setItems(result.packages);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载插件失败');
    } finally {
      setLoading(false);
    }
  }, [client]);
  useEffect(() => {
    if (tab !== 'discover') return;
    void search(debouncedQuery, category);
  }, [tab, debouncedQuery, category, search]);
  const loadInstalled = useCallback(async () => {
    setInstalledLoading(true);
    setError(null);
    try {
      const result = await client.api.marketplaceInstalled();
      setInstalledOutput(result.output?.trim() || '暂无已安装插件');
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取已安装插件失败');
    } finally {
      setInstalledLoading(false);
    }
  }, [client]);
  useEffect(() => {
    if (tab === 'installed' && installedOutput === null) void loadInstalled();
  }, [tab, installedOutput, loadInstalled]);
  const openDetail = useCallback((pkg: MarketplacePackage) => setSelected(pkg), []);
  const handleInstalled = useCallback((output: string) => {
    setInstalledMessage(output.trim() || '任务已提交，完成后刷新已安装列表');
    setInstalledOutput(null);
    setSelected(null);
    setTab('installed');
  }, []);
  const gutter = phone ? m.gutter : m.gutter + 6;
  return <div style={[styles.page, {
    backgroundColor: p.bg
  }]}>
      <div style={[styles.header, {
      paddingLeft: gutter,
      paddingRight: gutter,
      borderBottomColor: p.separator
    }]}>
        <div style={styles.headerCopy}>
          <span style={[styles.title, {
          color: p.text,
          fontSize: m.titleSize - 4
        }]}>
            插件广场
          </span>
          <span style={[styles.subtitle, {
          color: p.textTertiary,
          fontSize: m.descSize
        }]}>
            从 npm 发现 Pi 的扩展、技能与主题
          </span>
        </div>
        <Segmented options={[{
        value: 'installed',
        label: '已安装'
      }, {
        value: 'discover',
        label: '发现'
      }]} value={tab} onChange={value => setTab(value as MarketplaceTab)} />
      </div>

      {tab === 'discover' ? <div style={styles.scroll}>
          <div style={{
        gap: 10
      }}>
            <SearchField value={query} onChangeText={setQuery} onSubmit={() => void search(query, category)} />
            <div style={styles.chips}>
              {CATEGORIES.map(item => <Chip key={item.value} label={item.label} active={category === item.value} onClick={() => setCategory(item.value)} />)}
            </div>
          </div>

          {error ? <Notice text={error} tone="error" /> : null}

          {loading ? <div style={styles.centered}>
              <span size="small" color={p.textTertiary} />
            </div> : items.length === 0 ? <span style={[styles.emptyText, {
        color: p.textTertiary,
        fontSize: m.descSize
      }]}>
              没有匹配的插件。
            </span> : <div style={styles.grid}>
              {items.map(item => <PackageCard key={item.name} pkg={item} single={phone} onClick={() => void openDetail(item)} />)}
            </div>}
        </div> : <InstalledView output={installedOutput} loading={installedLoading} error={error} onRefresh={loadInstalled} gutter={gutter} single={phone} message={installedMessage} />}

      <PackageDetail pkg={selected} onClose={() => setSelected(null)} onInstalled={handleInstalled} />
    </div>;
}
