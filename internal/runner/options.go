package runner

const (
	TextStyleAuto     = "auto"
	TextStylePatch    = "patch"
	TextStyleSemantic = "semantic"
)

type Options struct {
	Format        string
	FailOn        string
	IgnorePaths   []string
	OnlyBreaking  bool
	IgnoreOrder   bool
	TextStyle     string
	UseColor      bool
	PathFormatter func(string) string
	OldPath       string
	NewPath       string
}

type CompareOptions struct {
	Format        string
	FailOn        string
	IgnorePaths   []string
	OnlyBreaking  bool
	IgnoreOrder   bool
	TextStyle     string
	UseColor      bool
	PathFormatter func(string) string
}

func (o Options) CompareOptions() CompareOptions {
	return CompareOptions{
		Format:        o.Format,
		FailOn:        o.FailOn,
		IgnorePaths:   o.IgnorePaths,
		OnlyBreaking:  o.OnlyBreaking,
		IgnoreOrder:   o.IgnoreOrder,
		TextStyle:     o.TextStyle,
		UseColor:      o.UseColor,
		PathFormatter: o.PathFormatter,
	}
}
