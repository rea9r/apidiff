package runner

const (
	TextStyleAuto     = "auto"
	TextStylePatch    = "patch"
	TextStyleSemantic = "semantic"
)

type Options struct {
	CompareOptions
	OldPath string
	NewPath string
}

type CompareOptions struct {
	Format           string
	IgnorePaths      []string
	IgnoreOrder      bool
	TextStyle        string
	UseColor         bool
	IgnoreWhitespace bool
	IgnoreCase       bool
	IgnoreEOL        bool
}
