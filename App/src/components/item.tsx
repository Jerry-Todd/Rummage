import React from "react";
import { FileEntry, FolderScan, formatSize } from "../lib/files";
import { File, ChevronRight } from "lucide-react";

export default function Item({
  item,
  contents,
}: {
  item: FileEntry | FolderScan;
  contents?: (FileEntry | FolderScan)[];
}) {

  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="flex flex-col items-start text-xs h-fit transition-all overflow-hidden">
      <div className="flex justify-between items-center w-full min-w-0 rounded-md hover:bg-mist-800 px-1 pr-2 py-0.5">
        <div className="flex items-center gap-1 h-5 min-w-0">
          {item.isDir ? (
            <ChevronRight
              className={`h-full shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
              onClick={() => setExpanded(!expanded)}
            />
          ) : (
            <File className="h-full shrink-0" />
          )}
          <span className="truncate">{item.path}</span>
        </div>
        <div className="shrink-0">{formatSize(item.size)}</div>
      </div>
      {expanded && contents && contents.length > 0 && (
        <div className="ml-4 w-[calc(100%-1rem)]">
          {[...contents]
            .sort((a, b) => b.size - a.size)
            .map((subItem) => (
              <Item
                key={subItem.path}
                item={subItem}
                contents={subItem.isDir ? subItem.contents : undefined}
              />
            ))}
        </div>
      )}
    </div>
  );
}
