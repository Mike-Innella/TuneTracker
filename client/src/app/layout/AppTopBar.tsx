import { useMemo, useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  IconButton,
  Stack,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/state/useAuth";

// app-level top bar
export default function TopBar() {
  const theme = useTheme();
  const isCompactNav = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // auth state + logout
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard", active: location.pathname.startsWith("/dashboard") },
      { label: "Projects", path: "/projects", active: location.pathname.startsWith("/projects") },
      { label: "Feed", path: "/feed", active: location.pathname.startsWith("/feed") },
      { label: "Profile", path: "/profile", active: location.pathname.startsWith("/profile") },
    ],
    [location.pathname]
  );

  async function handleLogout() {
    // backend logout + clear local user
    await logout();
    setMenuOpen(false);
    navigate("/auth");
  }

  function renderNavButton(
    label: string,
    path: string,
    active: boolean,
    fullWidth = false
  ) {
    return (
      <Button
        key={path}
        variant={active ? "contained" : "text"}
        onClick={() => {
          setMenuOpen(false);
          navigate(path);
        }}
        fullWidth={fullWidth}
        sx={{
          minWidth: 0,
          justifyContent: fullWidth ? "flex-start" : "center",
          px: fullWidth ? 1.5 : 2,
        }}
      >
        {label}
      </Button>
    );
  }

  return (
    <>
      <AppBar position="sticky" elevation={0} color="transparent">
        <Toolbar
          sx={{
            minHeight: { xs: 72, sm: 78, md: 84 },
            px: { xs: 1.25, sm: 1.75, md: 2.5 },
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flex: "1 1 auto",
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="TuneTracker logo"
              sx={{
                width: { xs: 34, sm: 36, md: 40 },
                height: { xs: 34, sm: 36, md: 40 },
                objectFit: "contain",
                opacity: 0.92,
                filter: "drop-shadow(0 2px 8px rgba(33, 216, 255, 0.2))",
                flexShrink: 0,
              }}
            />

            <Typography
              variant="h5"
              noWrap
              sx={{
                minWidth: 0,
                fontWeight: 700,
                color: "#6f67ff",
                fontSize: { xs: "1.15rem", sm: "1.3rem", md: "1.5rem" },
              }}
            >
              TuneTracker
            </Typography>
          </Box>

          {isCompactNav ? (
            <IconButton
              color="inherit"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMenuOpen((prev) => !prev)}
              sx={{
                flexShrink: 0,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
              }}
            >
              {menuOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
            </IconButton>
          ) : (
            <>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {navItems.map((item) =>
                  renderNavButton(item.label, item.path, item.active)
                )}
              </Stack>

              {user ? (
                <Button variant="outlined" onClick={handleLogout}>
                  Sign Out
                </Button>
              ) : (
                <Button variant="outlined" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{
          sx: {
            width: "min(320px, 100vw)",
            p: 2,
            background:
              "linear-gradient(180deg, rgba(20, 20, 28, 0.98) 0%, rgba(12, 12, 18, 0.98) 100%)",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            boxSizing: "border-box",
          },
        }}
      >
        <Stack spacing={2} sx={{ height: "100%" }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              component="img"
              src="/logo.png"
              alt="TuneTracker logo"
              sx={{
                width: 34,
                height: 34,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#6f67ff" }}>
              TuneTracker
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            {navItems.map((item) =>
              renderNavButton(item.label, item.path, item.active, true)
            )}
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Divider />

          {user ? (
            <Button variant="outlined" onClick={handleLogout} fullWidth>
              Sign Out
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => {
                setMenuOpen(false);
                navigate("/auth");
              }}
              fullWidth
            >
              Sign In
            </Button>
          )}
        </Stack>
      </Drawer>
    </>
  );
}
