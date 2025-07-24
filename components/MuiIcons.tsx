import * as MuiIcons from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';

interface MuiIconProps extends Omit<SvgIconProps, 'color' | 'fontSize'> {
    icon: string;
    color?: string; // e.g., "#0d9488"
    size?: 'inherit' | 'small' | 'medium' | 'large' | number | string; // e.g., 24, '2rem'
}

export const MuiIcon = ({ icon, color, size = 'medium', sx, ...props }: MuiIconProps) => {
    const IconComponent = MuiIcons[icon as keyof typeof MuiIcons];

    if (!IconComponent) {
        console.warn(`MUI Icon "${icon}" not found.`);
        return null;
    }

    const isNativeSize = ['inherit', 'small', 'medium', 'large'].includes(size as string);

    return (
        <IconComponent
            {...props}

            fontSize={isNativeSize ? (size as SvgIconProps['fontSize']) : undefined}
            sx={{
                fill: color,
                ...(isNativeSize ? {} : { fontSize: size }),
                ...sx,
            }}
        />
    );
};
