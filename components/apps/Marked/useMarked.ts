import useFileDrop from "components/system/Files/FileManager/useFileDrop";
import { useFileSystem } from "contexts/fileSystem";
import { useSession } from "contexts/session";
import { useCallback, useEffect } from "react";
import { useTheme } from "styled-components";
import { loadFiles } from "utils/functions";

type MarkedOptions = {
  headerIds?: boolean;
};

declare global {
  interface Window {
    marked: {
      parse: (markdownString: string, options: MarkedOptions) => string;
    };
  }
}

const libs = ["/Program Files/Marked/marked.min.js"];

const useMarked = (
  id: string,
  url: string,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  loading: boolean
): void => {
  const { readFile } = useFileSystem();
  const { onDragOver, onDrop } = useFileDrop({ id });
  const { setForegroundId } = useSession();
  const passEventsThroughIframe = useCallback(() => {
    const iframe = containerRef.current?.querySelector("iframe");

    if (iframe) {
      iframe.addEventListener("load", () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.addEventListener("dragover", onDragOver);
          iframe.contentWindow.addEventListener("drop", onDrop);
          iframe.contentWindow.addEventListener("focus", () => {
            setForegroundId(id);
            containerRef.current?.closest("section")?.focus();
          });

          [...iframe.contentWindow.document.links].forEach((link) => {
            // eslint-disable-next-line no-param-reassign
            link.target = "_blank";
          });
        }
      });
    }
  }, [containerRef, id, onDragOver, onDrop, setForegroundId]);
  const { formats } = useTheme();
  const loadFile = useCallback(async () => {
    const iframe = containerRef.current?.querySelector("iframe");

    if (iframe) {
      const markdownFile = await readFile(url);

      iframe.srcdoc = `
        <style>
          body {
            font-family: ${formats.systemFont};
            padding: 0 16px;
          }
        </style>
        ${window.marked.parse(markdownFile.toString(), {
          headerIds: false,
        })}
      `;
    }
  }, [containerRef, formats.systemFont, readFile, url]);

  useEffect(() => {
    if (loading) {
      loadFiles(libs).then(() => {
        if (window.marked) {
          setLoading(false);
          passEventsThroughIframe();
        }
      });
    }
  }, [loading, passEventsThroughIframe, setLoading]);

  useEffect(() => {
    if (!loading && url) loadFile();
  }, [loadFile, loading, url]);
};

export default useMarked;
