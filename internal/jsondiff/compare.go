package jsondiff

import (
	"reflect"

	"github.com/rea9r/xdiff/internal/delta"
)

func Compare(oldValue, newValue any) []delta.Diff {
	return CompareWithOptions(oldValue, newValue, Options{})
}

func CompareWithOptions(oldValue, newValue any, opts Options) []delta.Diff {
	if opts.IgnoreOrder {
		oldValue = normalizeUnorderedValue(oldValue)
		newValue = normalizeUnorderedValue(newValue)
	}

	var diffs []delta.Diff
	compare("", oldValue, newValue, &diffs)
	return diffs
}

func compare(path string, oldValue, newValue any, diffs *[]delta.Diff) {
	oldObj, oldIsObj := oldValue.(map[string]any)
	newObj, newIsObj := newValue.(map[string]any)
	if oldIsObj || newIsObj {
		if !oldIsObj || !newIsObj {
			*diffs = append(*diffs, delta.Diff{
				Type:     delta.TypeChanged,
				Path:     path,
				OldValue: oldValue,
				NewValue: newValue,
			})
			return
		}
		compareObjects(path, oldObj, newObj, diffs)
		return
	}

	oldArr, oldIsArr := oldValue.([]any)
	newArr, newIsArr := newValue.([]any)
	if oldIsArr || newIsArr {
		if !oldIsArr || !newIsArr {
			*diffs = append(*diffs, delta.Diff{
				Type:     delta.TypeChanged,
				Path:     path,
				OldValue: oldValue,
				NewValue: newValue,
			})
			return
		}
		compareArrays(path, oldArr, newArr, diffs)
		return
	}

	if reflect.TypeOf(oldValue) != reflect.TypeOf(newValue) {
		appendTypeChanged(diffs, path, oldValue, newValue)
		return
	}

	if !reflect.DeepEqual(oldValue, newValue) {
		*diffs = append(*diffs, delta.Diff{
			Type:     delta.Changed,
			Path:     path,
			OldValue: oldValue,
			NewValue: newValue,
		})
	}
}

func appendTypeChanged(diffs *[]delta.Diff, path string, oldValue, newValue any) {
	*diffs = append(*diffs, delta.Diff{
		Type:     delta.TypeChanged,
		Path:     path,
		OldValue: oldValue,
		NewValue: newValue,
	})
}
