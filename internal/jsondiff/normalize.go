package jsondiff

import (
	"encoding/json"
	"fmt"
	"sort"
)

type normalizedItem struct {
	key   string
	value any
}

func normalizeUnorderedValue(v any) any {
	switch typed := v.(type) {
	case map[string]any:
		out := make(map[string]any, len(typed))
		for k, child := range typed {
			out[k] = normalizeUnorderedValue(child)
		}
		return out
	case []any:
		items := make([]normalizedItem, len(typed))
		for i, child := range typed {
			nv := normalizeUnorderedValue(child)
			items[i] = normalizedItem{
				key:   canonicalKey(nv),
				value: nv,
			}
		}

		sort.SliceStable(items, func(i, j int) bool {
			return items[i].key < items[j].key
		})

		out := make([]any, len(items))
		for i, item := range items {
			out[i] = item.value
		}
		return out
	default:
		return v
	}
}

func canonicalKey(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Sprintf("%T:%v", v, v)
	}
	return string(b)
}
