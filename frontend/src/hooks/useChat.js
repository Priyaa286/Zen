import { useChatContext } from '@/context/ChatContext';
import { useAppContext } from '@/context/AppContext';

export function useChat() {
  const chat = useChatContext();
  const { destinationCountry, preferredCurrency, useMockApi } = useAppContext();

  return {
    ...chat,
    destinationCountry,
    preferredCurrency,
    useMockApi,
  };
}

export default useChat;
