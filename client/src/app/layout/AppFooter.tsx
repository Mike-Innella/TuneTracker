import { Box, Button, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AppFooter() {
  const navigate = useNavigate();
  const location = useLocation();

  const footerLinks = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: "Feed", path: "/feed" },
      { label: "Profile", path: "/profile" },
    ],
    []
  );

  return (
    <Box component="footer" className="app-footer">
      <Box className="page-wrap app-footer-wrap">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 3 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ mb: 0.75 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#6f67ff",
                  letterSpacing: "-0.01em",
                }}
              >
                TuneTracker
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                maxWidth: 520,
                overflowWrap: "anywhere",
              }}
            >
              Organize projects, review tracks, and keep public sharing readable on every screen.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            flexWrap="wrap"
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            {footerLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);

              return (
                <Button
                  key={link.path}
                  variant={isActive ? "contained" : "text"}
                  onClick={() => navigate(link.path)}
                  sx={{
                    minWidth: 0,
                    width: { xs: "calc(50% - 4px)", sm: "auto" },
                    justifyContent: "center",
                    background: isActive ? "rgba(111, 99, 255, 0.18)" : "transparent",
                    boxShadow: isActive ? "0 6px 18px rgba(102, 87, 255, 0.14)" : "none",
                    "&:hover": {
                      background: isActive
                        ? "rgba(111, 99, 255, 0.22)"
                        : "rgba(255, 255, 255, 0.04)",
                      boxShadow: "none",
                    },
                    "&:active": {
                      transform: "none",
                      opacity: 0.94,
                    },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
