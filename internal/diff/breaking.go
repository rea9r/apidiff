package diff

func IsBreaking(t DiffType) bool {
	return t == Removed || t == TypeChanged
}
