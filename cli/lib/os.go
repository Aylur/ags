package lib

import (
	"fmt"
	"os"
	"os/exec"
)

var r = "\x1b[0m"

func Mkdir(path string) {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		err := os.MkdirAll(path, os.ModePerm)
		if err != nil {
			Err(err)
		}
	}
}

func Rm(file string) {
	if err := os.RemoveAll(file); err != nil {
		Err(err)
	}
}

func Ln(target, linkName string) {
	if err := os.Symlink(target, linkName); err != nil {
		Err(err)
	}
}

func Cwd() string {
	cwd, err := os.Getwd()
	if err != nil {
		Err(err)
	}
	return cwd
}

func FileExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}

func WriteFile(path string, content string) {
	err := os.WriteFile(path, []byte(content), 0644)
	if err != nil {
		Err(err)
	}
}

func ReadFile(path string) []byte {
	data, err := os.ReadFile(path)
	if err != nil {
		Err(err)
	}
	return data
}

func Exec(cmd string, args ...string) *exec.Cmd {
	_, err := exec.LookPath(cmd)
	if err != nil {
		Err(`executable "` + Magenta(cmd) + `" not found in $PATH`)
	}
	return exec.Command(cmd, args...)
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
