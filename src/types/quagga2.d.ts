declare module '@ericblade/quagga2' {
  interface QuaggaJSResultObject {
    codeResult: {
      code: string;
      format: string;
    };
  }

  interface QuaggaJSConfiguration {
    inputStream: {
      name?: string;
      type?: string;
      target?: HTMLElement;
      constraints?: {
        width?: number;
        height?: number;
        facingMode?: string;
      };
    };
    decoder?: {
      readers?: string[];
    };
  }

  interface QuaggaStatic {
    init: (config: QuaggaJSConfiguration, callback?: (err: any) => void) => Promise<void>;
    start: () => void;
    stop: () => void;
    onDetected: (callback: (result: QuaggaJSResultObject) => void) => void;
  }

  const Quagga: QuaggaStatic;
  export default Quagga;
}