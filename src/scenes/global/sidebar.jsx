import { useState } from 'react';
import { Sidebar as ProSideBar, Menu, MenuItem, sidebarClasses, menuClasses } from 'react-pro-sidebar';
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from 'react-router-dom';
import { tokens } from '../../theme';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import AddBoxIcon from '@mui/icons-material/AddBox';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import BorderAllIcon    from '@mui/icons-material/BorderAll'

const Item = ({title, to, icon, selected, setSelected }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (
        <MenuItem
            active={selected === title}
            style={{ color: colors.grey[100] }}
            onClick={() => setSelected(title)}
            icon={icon}
            component={<Link to={to} />}
        >
            <Typography>{title}</Typography>
        </MenuItem>
    );
};

const Sidebar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode)
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selected, setSelected]       = useState('Dashboard');
    const viewHeight = window.outerHeight;

return (
    <div className='proSideBar'>
        <ProSideBar
            rootStyles={{
                [`.${sidebarClasses.container}`]: {
                    backgroundColor: `${colors.primary[400]}`,
                    height: `100vh !important`
                }
            }}
            collapsed={isCollapsed}
        >
            <Menu menuItemStyles={{
                button : {
                    '&:hover' : {
                        backgroundColor: `${colors.primary[200]} !important`,
                        color: 'white !important',
                    },
                    color: 'white',
                    backgroundColor: `${colors.primary[400]}`
                },
            }}
            iconShape='square'
            >
                <MenuItem
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
                    style={{
                        margin: '10px 0 20px 0',
                        color:  colors.grey[100],
                    }}
                >
                    {!isCollapsed && (
                        <Box
                            display='flex'
                        >
                            <IconButton
                                onClick={() => setIsCollapsed(!isCollapsed)}
                            >
                                <MenuOutlinedIcon />
                            </IconButton>  {/*shows the menu icon even if collapsed*/}
                        </Box>
                    )}
                </MenuItem>
                {!isCollapsed && (
                    <Box mb='25px'>
                        <Box
                            display='flex'
                            justifyContent='center'
                            alignItems='center'
                        >
                            <img
                                alt='profile-user'
                                width='100px'
                                height='100px'
                                src={`../../assets/bondi.jpg`}
                                style={{cursor: 'pointer', borderRadius: '10%'}}
                            />
                        </Box>
                        <Box textAlign='center'>
                            <Typography
                                variant='h2'
                                color={ colors.grey[100] }
                                fontWeight='bold'
                                sx={{ m: '10px 0 0 0' }}
                            >
                                Bondi League
                            </Typography>
                        </Box>
                    </Box>
                )}
            <Box>
            <Item
                title='League'
                to='/league'
                icon={<GolfCourseIcon />}
                selected={selected}
                setSelected={setSelected}
            />
            <Item
                title='Individual'
                to='/individual'
                icon={<EmojiPeopleIcon />}
                selected={selected}
                setSelected={setSelected}
            />
            <Item
                title='Scores Table'
                to='/scorestable'
                icon={<BorderAllIcon />}
                selected={selected}
                setSelected={setSelected}
            />
            <Item
                title='New Week'
                to='/addScores'
                icon={<AddBoxIcon />}
                selected={selected}
                setSelected={setSelected}
            />
            </Box>
            </Menu>
        </ProSideBar>
    </div>
    );
};

export default Sidebar;