package runner

import "fmt"

func isSupportedTextStyle(style string) bool {
	switch style {
	case "", TextStyleAuto, TextStylePatch, TextStyleSemantic:
		return true
	default:
		return false
	}
}

func resolveJSONTextStyle(opts CompareOptions) (string, error) {
	switch opts.TextStyle {
	case "", TextStyleAuto:
		if len(opts.IgnorePaths) > 0 || opts.OnlyBreaking || opts.IgnoreOrder {
			return TextStyleSemantic, nil
		}
		return TextStylePatch, nil
	case TextStylePatch:
		if len(opts.IgnorePaths) > 0 || opts.OnlyBreaking || opts.IgnoreOrder {
			return "", fmt.Errorf("text style %q cannot be used with --ignore-path, --only-breaking, or --ignore-order", TextStylePatch)
		}
		return TextStylePatch, nil
	case TextStyleSemantic:
		return TextStyleSemantic, nil
	default:
		return "", fmt.Errorf("invalid text style %q", opts.TextStyle)
	}
}

func resolveTextDiffStyle(opts CompareOptions) (string, error) {
	switch opts.TextStyle {
	case "", TextStyleAuto:
		if len(opts.IgnorePaths) > 0 || opts.OnlyBreaking {
			return TextStyleSemantic, nil
		}
		return TextStylePatch, nil
	case TextStylePatch:
		if len(opts.IgnorePaths) > 0 || opts.OnlyBreaking {
			return "", fmt.Errorf("text style %q cannot be used with --ignore-path or --only-breaking", TextStylePatch)
		}
		return TextStylePatch, nil
	case TextStyleSemantic:
		return TextStyleSemantic, nil
	default:
		return "", fmt.Errorf("invalid text style %q", opts.TextStyle)
	}
}

func resolveDeltaTextStyle(opts CompareOptions) (string, error) {
	switch opts.TextStyle {
	case "", TextStyleAuto, TextStyleSemantic:
		return TextStyleSemantic, nil
	case TextStylePatch:
		return "", fmt.Errorf("text style %q is not supported for delta-only comparisons", TextStylePatch)
	default:
		return "", fmt.Errorf("invalid text style %q", opts.TextStyle)
	}
}
