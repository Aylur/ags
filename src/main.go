package main

func main() {
	if *Opts.help {
		PrintHelp()
	}

	if *Opts.version {
		PrintVersion()
	}

	if *Opts.list {
		List()
	}

	if *Opts.quit {
		Quit()
	}

	if *Opts.message != "" {
		Message()
	}

	if *Opts.inspector {
		Inspector()
	}

	if *Opts.toggleWindow != "" {
		ToggleWindow()
	}

	if *Opts.genTypes && !*Opts.init {
		GenTypes()
	}

	if *Opts.init {
		InitConfig()
	}

	if *Opts.init || *Opts.genTypes {
		return
	}

	Run()
}
