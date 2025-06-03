import React, { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

interface ISBNScannerProps {
  onDetected: (isbn: string) => void;
  onError: (error: string) => void;
}

const ISBNScanner: React.FC<ISBNScannerProps> = ({ onDetected, onError }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!scannerRef.current) {
      console.error("Scanner ref not available");
      return;
    }

    const initQuagga = async () => {
      try {
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              facingMode: "environment",
              width: 640,
              height: 480,
            },
            area: {
              top: "0%",
              right: "0%",
              left: "0%",
              bottom: "0%",
            },
          },
          decoder: {
            readers: ["ean_reader", "ean_8_reader"],
            multiple: false,
          },
          locate: true,
          numOfWorkers: 4,
          frequency: 10,
        });

        Quagga.start();
        setIsInitialized(true);

        Quagga.onDetected((result) => {
          if (result && result.codeResult && result.codeResult.code) {
            const isbn = result.codeResult.code;
            if (isbn && isbn.length >= 10) {
              onDetected(isbn);
              Quagga.stop();
            }
          }
        });
      } catch (error) {
        console.error("Failed to initialize scanner:", error);
        onError(
          "Failed to access camera. Please ensure camera permissions are granted and try again.",
        );
      }
    };

    initQuagga();

    return () => {
      if (isInitialized) {
        Quagga.stop();
      }
    };
  }, [onDetected, onError]);

  return (
    <div className="relative">
      <div
        ref={scannerRef}
        className="w-full aspect-video rounded-lg overflow-hidden bg-black"
        style={{ minHeight: "300px" }}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary-500/50" />
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-primary-500/50" />
        <div className="absolute inset-0 border-2 border-primary-500 rounded-lg">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary-500" />
        </div>
      </div>
    </div>
  );
};

export default ISBNScanner;
