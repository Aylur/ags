package main

import (
	"fmt"
	"os"
	"os/exec"
)

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

func Mkdir(path string) {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		err := os.MkdirAll(path, os.ModePerm)
		if err != nil {
			Err(err)
		}
	}
}

func WriteFile(path string, content string) {
	os.WriteFile(path, []byte(content), 0644)
}

func Exec(cmd string, args ...string) *exec.Cmd {
	_, err := exec.LookPath(cmd)
	if err != nil {
		Err(`executable "` + Magenta(cmd) + `" not found in $PATH`)
	}
	return exec.Command(cmd, args...)
}

func HideCursor() {
	fmt.Print("\033[?25l")
}

func ShowCursor() {
	fmt.Print("\033[?25h")
}

func Invert(str string) string {
	return "\x1b[7m" + str + r
}

func Red(str string) string {
	return "\x1b[31m" + str + r
}

func Green(str string) string {
	return "\x1b[32m" + str + r
}

func Yellow(str string) string {
	return "\x1b[33m" + str + r
}

func Blue(str string) string {
	return "\x1b[34m" + str + r
}

func Magenta(str string) string {
	return "\x1b[35m" + str + r
}

func Cyan(str string) string {
	return "\x1b[36m" + str + r
}

func Err(err any) {
	switch v := err.(type) {
	case string:
		fmt.Fprintln(os.Stderr, Red("error: ")+v)
	case error:
		fmt.Fprintln(os.Stderr, Red("error: ")+v.Error())
	}
	os.Exit(1)
}