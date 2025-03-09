export const usePerfMonitor = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const perf = require('@react-three/fiber').perf
      perf({ showGraph: true })
    }
  }, [])
} 