import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const bg = "#050505";
const surface = "#111118";
const surfaceAlt = "#151520";
const borderSoft = "rgba(255, 255, 255, 0.06)";

const textPrimary = "#f5f7ff";
const textSecondary = "rgba(255, 255, 255, 0.62)";
const textMuted = "rgba(255, 255, 255, 0.38)";

const accent = "#6f63ff";
const accentStrong = "#8b5cf6";
const accentSoft = "rgba(111, 99, 255, 0.18)";
const success = "#68d391";
const successSoft = "rgba(104, 211, 145, 0.16)";
const error = "#ff8aa1";
const errorSoft = "rgba(255, 138, 161, 0.16)";
const info = "#7dd3fc";
const infoSoft = "rgba(125, 211, 252, 0.14)";
const radiusPanel = 20;
const radiusControl = 10;
const radiusDialog = 24;

const appThemeBase = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: bg,
      paper: surface,
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
    },
    primary: {
      main: accent,
      dark: accentStrong,
      contrastText: "#ffffff",
    },
    success: {
      main: success,
      contrastText: "#09110c",
    },
    error: {
      main: error,
      contrastText: "#1a0a0f",
    },
    info: {
      main: info,
      contrastText: "#071018",
    },
    divider: borderSoft,
  },

  shape: {
    borderRadius: radiusPanel,
  },

  typography: {
    fontFamily: `"Space Grotesk", "Sora", "Inter", sans-serif`,
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.04em",
      lineHeight: 1.05,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.035em",
      lineHeight: 1.08,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.1,
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.15,
    },
    subtitle1: {
      fontWeight: 500,
      color: textSecondary,
    },
    body1: {
      color: textPrimary,
    },
    body2: {
      color: textSecondary,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "-0.01em",
      fontSize: "0.98rem",
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          backgroundColor: bg,
          overflowX: "hidden",
          WebkitTextSizeAdjust: "100%",
        },
        body: {
          color: textPrimary,
          backgroundColor: bg,
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(92, 74, 255, 0.18) 0%, rgba(92, 74, 255, 0.08) 22%, rgba(0, 0, 0, 0) 48%),
            radial-gradient(circle at 50% 100%, rgba(92, 74, 255, 0.14) 0%, rgba(92, 74, 255, 0.05) 20%, rgba(0, 0, 0, 0) 42%),
            linear-gradient(180deg, #07070b 0%, #050505 100%)
          `,
          backgroundAttachment: "fixed",
          overflowX: "hidden",
        },
        "#root": {
          minHeight: "100vh",
          isolation: "isolate",
        },
        "*": {
          boxSizing: "border-box",
          scrollbarWidth: "thin",
          scrollbarColor: `${accent} rgba(255, 255, 255, 0.08)`,
        },
        "img, svg, video, canvas": {
          maxWidth: "100%",
          height: "auto",
        },
        "button, [role='button'], input, textarea, select": {
          touchAction: "manipulation",
        },
        "*::-webkit-scrollbar": {
          width: 10,
          height: 10,
        },
        "*::-webkit-scrollbar-track": {
          background: "rgba(255, 255, 255, 0.06)",
          borderRadius: 999,
        },
        "*::-webkit-scrollbar-thumb": {
          background: `linear-gradient(180deg, ${accentStrong} 0%, ${accent} 100%)`,
          borderRadius: 999,
          border: "2px solid rgba(8, 8, 12, 0.55)",
        },
        "*::-webkit-scrollbar-thumb:hover": {
          background: `linear-gradient(180deg, #9d76ff 0%, #7b6fff 100%)`,
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(180deg, rgba(20, 20, 28, 0.96), rgba(16, 16, 22, 0.92))",
          borderBottom: `1px solid ${borderSoft}`,
          boxShadow: "none",
          backdropFilter: "blur(14px)",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          background: `linear-gradient(180deg, ${surfaceAlt} 0%, ${surface} 100%)`,
          border: `1px solid ${borderSoft}`,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 16px 40px rgba(0, 0, 0, 0.34)",
          backdropFilter: "blur(6px)",
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${borderSoft}`,
          backdropFilter: "blur(10px)",
        },
        standardInfo: {
          backgroundColor: infoSoft,
          color: "#d9f4ff",
          borderColor: "rgba(125, 211, 252, 0.24)",
        },
        standardSuccess: {
          backgroundColor: successSoft,
          color: "#d8ffe7",
          borderColor: "rgba(104, 211, 145, 0.24)",
        },
        standardError: {
          backgroundColor: errorSoft,
          color: "#ffe0e6",
          borderColor: "rgba(255, 138, 161, 0.24)",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radiusControl,
          minHeight: 48,
          paddingInline: 24,
          boxShadow: "none",
          "@media (max-width:599.95px)": {
            minHeight: 44,
            paddingInline: 18,
          },
        },

        contained: {
          background: "linear-gradient(90deg, #5f67ff 0%, #875cff 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 24px rgba(102, 87, 255, 0.28)",
          "&:hover": {
            background: "linear-gradient(90deg, #6971ff 0%, #9467ff 100%)",
            boxShadow: "0 12px 28px rgba(102, 87, 255, 0.34)",
          },
          "&:active": {
            transform: "translateY(1px)",
          },
        },

        outlined: {
          borderColor: "rgba(255, 255, 255, 0.12)",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          color: textPrimary,
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.18)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },

        text: {
          color: "#b9bfd8",
          "&:hover": {
            backgroundColor: "rgba(111, 99, 255, 0.08)",
            color: "#ffffff",
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            borderRadius: radiusControl,
            backgroundColor: "rgba(255, 255, 255, 0.035)",
            color: textPrimary,
            minHeight: 56,
            "@media (max-width:599.95px)": {
              minHeight: 52,
            },
          },

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.10)",
            transition: "all 0.2s ease",
          },

          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.16)",
          },

          "& .MuiOutlinedInput-root.Mui-focused": {
            backgroundColor: "rgba(255, 255, 255, 0.045)",
          },

          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: accent,
            boxShadow: `0 0 0 3px ${accentSoft}`,
          },

          "& .MuiInputBase-input::placeholder": {
            color: textMuted,
            opacity: 1,
          },

          "& .MuiInputLabel-root": {
            color: "rgba(255, 255, 255, 0.52)",
          },

          "& .MuiInputLabel-root.Mui-focused": {
            color: "#d9ddff",
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          height: 28,
          maxWidth: "100%",
          fontWeight: 600,
          fontSize: "0.82rem",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#d7dcff",
          "@media (max-width:599.95px)": {
            height: 26,
            fontSize: "0.76rem",
          },
          "& .MuiChip-label": {
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: "#ffffff",
          },
          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: accent,
            opacity: 1,
          },
        },
        track: {
          borderRadius: 999,
          backgroundColor: "rgba(255, 255, 255, 0.18)",
          opacity: 1,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: borderSoft,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          background: `linear-gradient(180deg, ${surfaceAlt} 0%, ${surface} 100%)`,
          border: `1px solid ${borderSoft}`,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          borderRadius: radiusDialog,
          margin: 16,
          width: "calc(100% - 32px)",
          "@media (min-width:600px)": {
            margin: 24,
            width: "calc(100% - 48px)",
          },
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: 24,
          "@media (max-width:599.95px)": {
            padding: 16,
          },
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "0 24px 24px",
          gap: 12,
          "@media (max-width:599.95px)": {
            padding: "0 16px 16px",
            flexDirection: "column-reverse",
            alignItems: "stretch",
          },
          "& > :not(style)": {
            marginLeft: "0 !important",
          },
          "& > :not(style), & > .MuiButton-root": {
            "@media (max-width:599.95px)": {
              width: "100%",
            },
          },
        },
      },
    },
  },
});

export const appTheme = responsiveFontSizes(appThemeBase, {
  variants: ["h3", "h4", "h5", "h6", "subtitle1", "body1", "body2", "button"],
});
