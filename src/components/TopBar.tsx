"use client";

import SearchIcon from "@mui/icons-material/Search";
import { AppBar, Box, InputAdornment, TextField, Toolbar, Typography } from "@mui/material";

interface TopBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export default function TopBar({ searchTerm, onSearchTermChange }: TopBarProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid rgba(15, 23, 42, 0.09)",
        backgroundColor: "rgba(255, 255, 255, 0.86)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Toolbar sx={{ py: 1, gap: 2, flexWrap: "wrap" }}>
        <Typography component="h1" variant="h5" sx={{ letterSpacing: "-0.02em" }}>
          Mind Luster Kanban
        </Typography>

        <Box sx={{ marginLeft: "auto", width: { xs: "100%", sm: 360 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search title or description"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
