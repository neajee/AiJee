import { memo, useRef, useState, useEffect } from 'react';
import { Animated } from "@/styles/motion";
import { Check, X } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { matchesModelSearch } from '../../utils/prompt-input-search';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import { ProviderIcon } from '@/components/provider-icons';
import type { AgentConfigHandle } from '@aijee/client-sdk';
interface NarrowModelSheetProps {
  visible: boolean;
  sessionId?: string | null;
  onClose: () => void;
  config: AgentConfigHandle;
}

/**
 * Model and thinking level in one sheet, mirroring the single toolbar control
 * on wide viewports: picking a model and picking how hard it thinks is one
 * decision, so it should not cost two trips.
 */

function NarrowModelSheetComponent({
  visible,
  sessionId,
  onClose,
  config
}: NarrowModelSheetProps) {
  const theme = usePromptTheme();
  const searchRef = useRef<TextInput>(null);
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const models = config.models;
  const currentModel = config.state?.model;
  useEffect(() => {
    if (visible) {
      Animated.parallel([Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }), Animated.spring(slideAnim, {
        toValue: 0,
        tension: 120,
        friction: 14,
        useNativeDriver: true
      })]).start();
    }
  }, [overlayAnim, slideAnim, visible]);
  const animateClose = (cb: () => void) => {
    Animated.parallel([Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }), Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true
    })]).start(() => cb());
  };
  const handleClose = () => {
    animateClose(() => {
      setSearch('');
      onClose();
    });
  };
  const handleSelect = (provider: string, modelId: string) => {
    config.setModel({
      provider,
      modelId
    });
    animateClose(() => {
      setSearch('');
      onClose();
    });
  };
  const providers = (() => {
    if (!models) return [];
    const grouped = new Map<string, Array<{
      id: string;
      name: string;
      provider: string;
      reasoning?: boolean;
    }>>();
    const order: string[] = [];
    for (const m of models) {
      const provider = m.provider ?? "unknown";
      const name = m.name ?? m.id;
      const searchable = {
        ...m,
        name,
        provider
      };
      if (!matchesModelSearch(search, searchable)) continue;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
        order.push(provider);
      }
      grouped.get(provider)!.push({
        ...m,
        name,
        provider
      });
    }
    return order.map(p => ({
      name: p,
      models: grouped.get(p)!
    }));
  })();
  return <div hidden={!visible}>
      <div className="flex flex-col">
        <div className={"  opacity-100"}>
          <button className="inline-flex items-center" onClick={handleClose} />
        </div>
        <div>
          <div className="flex flex-col">
            <div />
          </div>
          <span className={"  text-foreground"}>
            Select Model
          </span>
          <div className={"  bg-card border-border"}>
            <input ref={searchRef} className={"  text-foreground"} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search models..." />
            {search.length > 0 && <button onClick={() => setSearch('')}>
                <X size={16} color={theme.textMuted} strokeWidth={2} />
              </button>}
          </div>
          <div className="flex flex-col">
            {providers.map(provider => <div key={provider.name}>
                <span className={"  text-foreground"}>
                  {provider.name}
                </span>
                {provider.models.map(model => {
              const isActive = model.id === currentModel?.id;
              return <button key={model.id} onClick={() => handleSelect(model.provider, model.id)}>
                      <div className="flex flex-col">
                        <ProviderIcon provider={model.provider} size={14} color={isActive ? theme.accentColor : theme.textMuted} />
                        <span>
                          {model.name}
                        </span>
                      </div>
                      {isActive && <Check size={16} color={theme.accentColor} strokeWidth={2} />}
                    </button>;
            })}
              </div>)}
          </div>

        </div>
      </div>
    </div>;
}
export const NarrowModelSheet = memo(NarrowModelSheetComponent);