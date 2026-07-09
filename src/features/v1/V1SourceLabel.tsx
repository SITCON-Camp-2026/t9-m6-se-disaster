import { v1SourceLabels } from "./v1-labels";

export function V1SourceLabel({ sourceType }: { sourceType: string }) {
  return (
    <span className="source-label source-label--v1">
      取得方式：{v1SourceLabels[sourceType] ?? sourceType}
    </span>
  );
}
