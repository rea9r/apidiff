package app

import "github.com/rea9r/apidiff/internal/diff"

type config struct {
	format       string
	ignorePaths  []string
	onlyBreaking bool
	oldPath      string
	newPath      string
}

func (c config) diffOptions() diff.Options {
	return diff.Options{
		IgnorePaths:  c.ignorePaths,
		OnlyBreaking: c.onlyBreaking,
	}
}

type Options struct {
	Format       string
	IgnorePaths  []string
	OnlyBreaking bool
	OldPath      string
	NewPath      string
}

func (c config) toOptions() Options {
	return Options{
		Format:       c.format,
		IgnorePaths:  c.ignorePaths,
		OnlyBreaking: c.onlyBreaking,
		OldPath:      c.oldPath,
		NewPath:      c.newPath,
	}
}
