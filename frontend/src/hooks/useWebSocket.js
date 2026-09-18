import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for connecting to a Laravel Reverb (Pusher-compatible) WebSocket channel.
 * @param {string} channelName - The channel to subscribe to (e.g. "hospital.1")
 * @param {string} eventName   - The event name to listen for (e.g. "BedAvailabilityUpdated")
 * @param {function} onMessage - Callback fired with parsed event data on each message
 */
const useWebSocket = (channelName, eventName, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef         = useRef(null);
  const reconnectRef  = useRef(null);  // holds the reconnect timeout id
  const onMessageRef  = useRef(onMessage);

  // Keep the callback ref fresh without re-triggering the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!import.meta.env.VITE_REVERB_APP_KEY) {
      console.warn('[useWebSocket] VITE_REVERB_APP_KEY is not set — WebSocket disabled.');
      return;
    }

    const REVERB_URL = [
      import.meta.env.VITE_REVERB_SCHEME || 'ws',
      '://',
      import.meta.env.VITE_REVERB_HOST || 'localhost',
      ':',
      import.meta.env.VITE_REVERB_PORT || 8080,
      '/app/',
      import.meta.env.VITE_REVERB_APP_KEY,
      '?protocol=7&client=js&version=8.0.0&flash=false',
    ].join('');

    // Named function so onclose can reference it without capturing itself
    function openConnection() {
      try {
        const ws = new WebSocket(REVERB_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[useWebSocket] Connected');
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            // Pusher handshake — send channel subscription
            if (payload.event === 'pusher:connection_established') {
              setIsConnected(true);
              setError(null);
              ws.send(JSON.stringify({
                event: 'pusher:subscribe',
                data: { auth: '', channel: channelName },
              }));
              return;
            }

            if (payload.event === 'pusher_internal:subscription_succeeded') return;

            // Match the target event (Laravel may prefix with namespace)
            const incoming = payload.event || '';
            const isMatch =
              incoming === eventName ||
              incoming.endsWith(`\\${eventName}`) ||
              incoming.endsWith(`.${eventName}`);

            if (isMatch && payload.channel === channelName) {
              const data =
                typeof payload.data === 'string'
                  ? JSON.parse(payload.data)
                  : payload.data;
              onMessageRef.current?.(data);
            }
          } catch (e) {
            console.error('[useWebSocket] Parse error', e);
          }
        };

        ws.onerror = () => {
          setError('WebSocket connection error.');
          setIsConnected(false);
        };

        ws.onclose = (e) => {
          setIsConnected(false);
          console.log('[useWebSocket] Closed', e.code);
          // Auto-reconnect unless we closed it intentionally (code 1000)
          if (e.code !== 1000) {
            reconnectRef.current = setTimeout(openConnection, 5000);
          }
        };
      } catch (err) {
        console.error('[useWebSocket] Failed to open', err);
        setError(err.message);
      }
    }

    openConnection();

    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close(1000, 'Component unmounted');
    };
  }, [channelName, eventName]); // onMessage intentionally excluded — tracked via ref

  return { isConnected, error };
};

export default useWebSocket;
