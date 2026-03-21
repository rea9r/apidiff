package runner

type Options struct {
	Format       string
	FailOn       string
	IgnorePaths  []string
	OnlyBreaking bool
	NoColor      bool
	OldPath      string
	NewPath      string
}

type CompareOptions struct {
	Format       string
	FailOn       string
	IgnorePaths  []string
	OnlyBreaking bool
	NoColor      bool
}

func (o Options) CompareOptions() CompareOptions {
	return CompareOptions{
		Format:       o.Format,
		FailOn:       o.FailOn,
		IgnorePaths:  o.IgnorePaths,
		OnlyBreaking: o.OnlyBreaking,
		NoColor:      o.NoColor,
	}
}
