import React, { useEffect } from "react";
import { scanFolder, type FolderScan } from "../lib/files";
import Item from "../components/item";
import { Disc3 } from "lucide-react";
import DonutChart from "../components/chart";


export default function Viewer() {
  const [files, setFiles] = React.useState<FolderScan>();
  const [isScanning, setIsScanning] = React.useState(true);

  useEffect(() => {
    let cancelled = false;

    scanFolder("/", true, (scan) => {
      if (!cancelled) setFiles(scan);
    }, 3).then((scan) => {
      if (!cancelled) {
        setFiles(scan);
        setIsScanning(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <div className="flex flex-1">
      <div className="bg-mist-900 max-h-full overflow-y-auto flex-1 min-h-0">
      {files &&
        [...files.contents]
          .sort((a, b) => b.size - a.size)
          .map((file) => (
            <Item key={file.path} item={file} contents={file.isDir ? file.contents : undefined}/>
          ))}
      {isScanning && (
        <p className="m-auto flex justify-center items-center gap-2">
          <Disc3 className="animate-spin transition-all" /> Scanning...
        </p>
      )}
      </div>
      <div className="flex-1 min-w-0 flex flex-coljustify-center items-center">
        {/* pie chart */}
        <DonutChart></DonutChart>
      </div>
    </div>
  );
}
