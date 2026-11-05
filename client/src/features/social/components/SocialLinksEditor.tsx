import { Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import type { SocialLink } from '../types';
import { mutedTextSx } from '../../../app/theme/uiStyles';

type SocialLinksEditorProps = {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
};

export default function SocialLinksEditor({ links, onChange }: SocialLinksEditorProps) {
  return (
    <>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Social Links</Typography>
        {links.map((link, idx) => (
          <Stack
            key={`link-${idx}`}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              label="Label"
              size="small"
              value={link.label}
              onChange={(e) => {
                const value = e.target.value;
                onChange(links.map((l, i) => (i === idx ? { ...l, label: value } : l)));
              }}
              sx={{ minWidth: { sm: 130 } }}
            />
            <TextField
              label="URL"
              size="small"
              value={link.url}
              onChange={(e) => {
                const value = e.target.value;
                onChange(links.map((l, i) => (i === idx ? { ...l, url: value } : l)));
              }}
              fullWidth
            />
            <IconButton
              aria-label="Remove social link"
              onClick={() => onChange(links.filter((_link, i) => i !== idx))}
              sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
        <Button
          variant="text"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onChange([...links, { label: '', url: '' }])}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add Link
        </Button>
      </Stack>

      {links.length > 0 && (
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={mutedTextSx}>
            Link Preview
          </Typography>
          {links
            .filter((link) => link.label.trim() && link.url.trim())
            .map((link, idx) => (
              <Typography
                key={`preview-${idx}`}
                component="a"
                href={link.url}
                target="_blank"
                rel="noreferrer"
                sx={{
                  color: '#9ec8ff',
                  textDecoration: 'underline',
                  width: 'fit-content',
                  overflowWrap: 'anywhere',
                }}
              >
                {link.label}
              </Typography>
            ))}
        </Stack>
      )}
    </>
  );
}
