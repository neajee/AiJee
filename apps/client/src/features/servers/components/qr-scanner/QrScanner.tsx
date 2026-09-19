import { toTailwind } from "@/styles/to-tailwind";
import { AlertCircle, Check, Wifi, X } from 'lucide-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QrScannerScanPanel } from './scan-panel';
import { styles } from './style-tokens';
import { useQrScannerController } from '../../hooks/use-qr-scanner-controller';
import type { QrScannerProps } from './component-types';
export function QrScanner({
  visible,
  onClose
}: QrScannerProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const cardBg = isDark ? '#1e1e1e' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? '#2a2a2a' : '#F6F6F6';
  const {
    step,
    scanned,
    connectParams,
    manualUrl,
    error,
    handleManualUrlChange,
    reset,
    handleClose,
    handleBarCodeScanned,
    handleManualSubmit,
    handleSelectIp
  } = useQrScannerController({
    visible,
    onClose
  });
  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)';
  const modalProps = {
    visible,
    transparent: true as const,
    onRequestClose: handleClose
  };
  if (step === 'pairing') {
    return <div {...modalProps} animationType="fade">
        <button className={toTailwind([styles.overlay, {
        backgroundColor: overlayBg
      }])} onClick={handleClose} aria-label="关闭配对弹窗">
          <button className={toTailwind([styles.card, {
          backgroundColor: cardBg,
          borderColor
        }])} onClick={event => event.stopPropagation()}>
            <div className={toTailwind(styles.statusCenter)}>
              <span size="large" color={textPrimary} />
              <span className={toTailwind([styles.statusTitle, {
              color: textPrimary
            }])}>Connecting to AiJee</span>
              <span className={toTailwind([styles.statusDesc, {
              color: textMuted
            }])}>Completing secure pairing…</span>
            </div>
            <button onClick={handleClose} className={toTailwind([styles.cancelBtn, {
            borderColor
          }])}>
              <span className={toTailwind([styles.cancelBtnText, {
              color: textMuted
            }])}>Cancel</span>
            </button>
          </button>
        </button>
      </div>;
  }
  if (step === 'done') {
    return <div {...modalProps} animationType="fade">
        <button className={toTailwind([styles.overlay, {
        backgroundColor: overlayBg
      }])} onClick={handleClose} aria-label="关闭配对成功弹窗">
          <button className={toTailwind([styles.card, {
          backgroundColor: cardBg,
          borderColor
        }])} onClick={event => event.stopPropagation()}>
            <div className={toTailwind(styles.statusCenter)}>
              <div className={toTailwind([styles.successCircle, {
              backgroundColor: isDark ? '#30D158' : '#34C759'
            }])}>
                <Check size={28} color="#fff" strokeWidth={2.5} />
              </div>
              <span className={toTailwind([styles.statusTitle, {
              color: textPrimary
            }])}>Connected</span>
            </div>
          </button>
        </button>
      </div>;
  }
  if (step === 'error') {
    return <div {...modalProps} animationType="fade">
        <button className={toTailwind([styles.overlay, {
        backgroundColor: overlayBg
      }])} onClick={handleClose} aria-label="关闭配对失败弹窗">
          <button className={toTailwind([styles.card, {
          backgroundColor: cardBg,
          borderColor
        }])} onClick={event => event.stopPropagation()}>
            <div className={toTailwind(styles.statusCenter)}>
              <div className={toTailwind([styles.errorCircle, {
              backgroundColor: isDark ? '#FF453A' : '#FF3B30'
            }])}>
                <AlertCircle size={28} color="#fff" strokeWidth={2} />
              </div>
              <span className={toTailwind([styles.statusTitle, {
              color: textPrimary
            }])}>Pairing Failed</span>
              <span className={toTailwind([styles.statusDesc, {
              color: textMuted
            }])}>{error}</span>
            </div>
            <div className={toTailwind(styles.errorActions)}>
              <button onClick={reset} className={toTailwind([styles.retryBtn, {
              backgroundColor: isDark ? '#fefdfd' : '#1a1a1a'
            }])}>
                <span className={toTailwind([styles.retryBtnText, {
                color: isDark ? '#1a1a1a' : '#fff'
              }])}>Try Again</span>
              </button>
              <button onClick={handleClose} className={toTailwind([styles.cancelBtn, {
              borderColor
            }])}>
                <span className={toTailwind([styles.cancelBtnText, {
                color: textMuted
              }])}>Cancel</span>
              </button>
            </div>
          </button>
        </button>
      </div>;
  }
  if (step === 'pick-ip' && connectParams) {
    return <div {...modalProps} animationType="fade">
        <button className={toTailwind([styles.overlay, {
        backgroundColor: overlayBg
      }])} onClick={handleClose} aria-label="关闭网络选择弹窗">
          <button className={toTailwind([styles.card, {
          backgroundColor: cardBg,
          borderColor
        }])} onClick={event => event.stopPropagation()}>
            <div className={toTailwind(styles.cardHeader)}>
              <span className={toTailwind([styles.cardTitle, {
              color: textPrimary
            }])}>Select Network</span>
              <button onClick={handleClose} className={toTailwind(styles.closeBtn)}>
                <X size={18} color={textMuted} strokeWidth={1.8} />
              </button>
            </div>
            <span className={toTailwind([styles.cardSubtitle, {
            color: textMuted
          }])}>
              {connectParams.hostname ? `"${connectParams.hostname}" is available on multiple addresses:` : 'Multiple addresses found:'}
            </span>
            <div className={toTailwind(styles.ipList)}>
              {connectParams.ips.map(ip => <button key={ip} onClick={() => handleSelectIp(ip)}>
                  <Wifi size={16} color={textMuted} strokeWidth={1.8} />
                  <div className={toTailwind(styles.ipInfo)}>
                    <span className={toTailwind([styles.ipText, {
                  color: textPrimary
                }])}>{ip}</span>
                    <span className={toTailwind([styles.ipPort, {
                  color: textMuted
                }])}>Port {connectParams.port}</span>
                  </div>
                </button>)}
            </div>
          </button>
        </button>
      </div>;
  }
  return <div {...modalProps} animationType="fade">
      <button className={toTailwind([styles.overlay, {
      backgroundColor: overlayBg
    }])} onClick={handleClose} aria-label="关闭扫码弹窗">
        <button className={toTailwind([styles.card, styles.scannerCard, {
        backgroundColor: cardBg,
        borderColor
      }])} onClick={event => event.stopPropagation()}>
          <div className={toTailwind(styles.cardHeader)}>
            <span className={toTailwind([styles.cardTitle, {
            color: textPrimary
          }])}>Scan QR Code</span>
            <button onClick={handleClose} className={toTailwind(styles.closeBtn)}>
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </button>
          </div>
          <QrScannerScanPanel visible={visible} scanned={scanned} isDark={isDark} textMuted={textMuted} onBarcodeData={handleBarCodeScanned} />
          <div className={toTailwind(styles.manualSection)}>
            <span className={toTailwind([styles.manualLabel, {
            color: textMuted
          }])}>
              {true ? 'Paste connect URL' : 'Or paste URL manually'}
            </span>
            <div className={toTailwind(styles.manualRow)}>
              <input className={toTailwind([styles.manualInput, {
              backgroundColor: inputBg,
              color: textPrimary,
              borderColor
            }])} value={manualUrl} onChangeText={handleManualUrlChange} placeholder="http://设备地址/?k=授权码" placeholderTextColor={isDark ? '#666' : '#bbb'} autoCapitalize="none" autoCorrect={false} />
              <button onClick={handleManualSubmit} className={toTailwind([styles.manualBtn, {
              backgroundColor: isDark ? '#fefdfd' : '#1a1a1a'
            }, !manualUrl.trim() && {
              opacity: 0.4
            }])} disabled={!manualUrl.trim()}>
                <span className={toTailwind([styles.manualBtnText, {
                color: isDark ? '#1a1a1a' : '#fff'
              }])}>Connect</span>
              </button>
            </div>
          </div>
          {error && <span className={toTailwind([styles.errorText, {
          color: isDark ? '#FF453A' : '#FF3B30'
        }])}>{error}</span>}
        </button>
      </button>
    </div>;
}
