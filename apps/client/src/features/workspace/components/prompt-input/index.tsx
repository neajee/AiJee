import { PromptInputView } from './prompt-input-view';
import { usePromptInputController, type PromptInputProps } from '../../hooks/use-prompt-input-controller';

export type { PromptInputProps } from '../../hooks/use-prompt-input-controller';

export function PromptInput(props: PromptInputProps) {
  const controller = usePromptInputController(props);
  return <PromptInputView {...controller} />;
}
