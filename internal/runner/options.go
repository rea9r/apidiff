package runner

type Options struct {
	Format        string
	FailOn        string
	IgnorePaths   []string
	OnlyBreaking  bool
	IgnoreOrder   bool
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
		UseColor:      o.UseColor,
		PathFormatter: o.PathFormatter,
	}
}
