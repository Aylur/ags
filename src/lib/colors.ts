export const fg = {
    black: (str: string) => "\x1b[30m" + str + r,
    red: (str: string) => "\x1b[31m" + str + r,
    green: (str: string) => "\x1b[32m" + str + r,
    yellow: (str: string) => "\x1b[33m" + str + r,
    blue: (str: string) => "\x1b[34m" + str + r,
    magenta: (str: string) => "\x1b[35m" + str + r,
    cyan: (str: string) => "\x1b[36m" + str + r,
    white: (str: string) => "\x1b[37m" + str,
    bright: {
        black: (str: string) => "\x1b[90m" + str + r,
        red: (str: string) => "\x1b[91m" + str + r,
        green: (str: string) => "\x1b[92m" + str + r,
        yellow: (str: string) => "\x1b[93m" + str + r,
        blue: (str: string) => "\x1b[94m" + str + r,
        magenta: (str: string) => "\x1b[95m" + str + r,
        cyan: (str: string) => "\x1b[96m" + str + r,
        white: (str: string) => "\x1b[97m" + str + r,
    }
}

export const bold = (str: string) => "\x1b[1m" + str
export const dim = (str: string) => "\x1b[2m" + str
export const underscore = (str: string) => "\x1b[4m" + str
export const invert = (str: string) => "\x1b[7m" + str

export const r = "\x1b[0m"
