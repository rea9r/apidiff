package delta

func IsBreaking(t DiffType) bool {
	return t == Removed || t == TypeChanged
}
