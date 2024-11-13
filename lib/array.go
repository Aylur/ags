package lib

func Map[T any, R any](input []T, fn func(T) R) []R {
	result := make([]R, len(input))
	for i, v := range input {
		result[i] = fn(v)
	}
	return result
}

func Some[T any](input []T, fn func(T) bool) bool {
	for _, v := range input {
		if fn(v) {
			return true
		}
	}
	return false
}
