import React, { useState } from "react";
import Logo from "../assets/logo_ema.png"
import { ModeToggle } from "../components/mode-toggle"
import { Link } from "react-router-dom"

import {
  Navbar,
  Collapse,
  Typography,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";

import {
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { CalendarIcon } from "@heroicons/react/24/solid";

import { FaCloudRain } from "react-icons/fa";
import { GiHistogram } from "react-icons/gi";

import Sobre from "./sobre/Sobre";
import TooltipSocket from "../components/TooltipSocket"
import TooltipUsersOnline from "./TooltipUsersOnline";

const navListMenuItems = [
  {
    title: "Métricas Dia",
    description: "Registros referente ao dia de consulta. De 01/09/2019 até Hoje.",
    icon: CalendarIcon,
    link: "/metricas-dia",
    value: "metricas-dia"
  },
  {
    title: "Métrica Mês",
    description: "Métricas gerais referente ao mês de consulta. De Setembro de 2019 até hoje. ",
    icon: CalendarIcon,
    link: "/metricas-mes",
    value: "metricas-mes"
  },
  {
    title: "Métrica Ano",
    description: "Métricas referente ao ano atual.",
    icon: CalendarIcon,
    link: "/metricas-ano",
    values: "metricas-ano"
  },
  {
    title: "Chuvas no Mês",
    description: "Dados detalhados referente à chuvas.",
    icon: FaCloudRain,
    link: "/metricas-chuva",
    value: "metricas-chuva"
  },
  {
    title: "Dados Históricos",
    description: "Registros histórios agrupados por ano.",
    icon: GiHistogram,
    link: "/dados-historicos",
    value: "dados-historicos"
  },
];

const handleClick = (e) => {
  e.target.blur(); // Remove o foco após o clique
};

function NavListMenu() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const renderItems = navListMenuItems.map(
    ({ icon, title, description, value, link }, key) => (
      <span
        value={value}
        key={key}
      >
        <Link to={link}>
          <MenuItem className="flex items-center gap-3 rounded-lg
        hover:bg-gray-100
        dark:hover:!bg-blue-gray-700"
          >
            <div className="flex items-center justify-center rounded-lg p-2
          !bg-blue-gray-100 
          dark:!bg-blue-gray-700">
              {" "}
              {React.createElement(icon, {
                strokeWidth: 2,
                className: "h-6 text-gray-900 dark:text-blue-gray-100 w-6",
              })}
            </div>
            <div>
              <Typography
                variant="h6"
                // color="blue-gray"
                className="flex items-center text-sm font-bold 
              text-blue-gray-900 
              dark:text-blue-gray-50"
              >
                {title}
              </Typography>
              <Typography
                variant="lead"
                className="text-xs !font-medium text-blue-gray-600 dark:text-blue-gray-100"
              >
                {description}
              </Typography>
            </div>
          </MenuItem>
        </Link>
      </span >
    ),
  );

  return (
    <React.Fragment>
      <Menu
        open={isMenuOpen}
        handler={setIsMenuOpen}
        offset={{ mainAxis: 20 }}
        placement="bottom"
      >
        {/* <MenuHandler>
          <span className="font-medium">
            <ListItem
              className="flex items-center gap-1 py-2 pr-4 font-medium
              text-blue-gray-900 
              dark:text-blue-gray-100 dark:hover:!bg-blue-gray-700 "
              selected={isMenuOpen || isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((cur) => !cur)}
              onFocus={handleClick}
            >
              <Typography
                // as="span"
                variant="small"
                className="font-medium">
                Consultas
              </Typography>

              <ChevronDownIcon
                strokeWidth={2.5}
                className={`hidden h-3 w-3 transition-transform lg:block ${isMenuOpen ? "rotate-180" : ""}`}
              />
              <ChevronDownIcon
                strokeWidth={2.5}
                className={`block h-3 w-3 transition-transform lg:hidden ${isMobileMenuOpen ? "rotate-180" : ""}`}
              />
            </ListItem>
          </span>
        </MenuHandler> */}
        <MenuList className="hidden max-w-screen-xl lg:block border-0
        bg-gray-300
        dark:bg-black dark:opacity-10 rounded-xl mx-10">
          <ul className="grid grid-cols-3 gap-y-2">
            {renderItems}
          </ul>
        </MenuList>
      </Menu>
      <div className="block lg:hidden">
        <Collapse open={isMobileMenuOpen}>{renderItems}</Collapse>
      </div>
    </React.Fragment>
  );
}

function NavList() {
  return (
    <List className="mt-4 mb-6 p-0 lg:mt-0 lg:mb-0 lg:flex-row lg:p-1 ">
      <span>
        <Link to="./">
          <ListItem className="flex items-center gap-2 py-2 pr-4
        text-blue-gray-900 
        dark:text-blue-gray-100 dark:hover:bg-blue-gray-700"
          // onFocus={handleClick}
          >
            <Typography variant="small" className="font-medium">
              Início
            </Typography>
          </ListItem>
        </Link>
      </span>
      <NavListMenu />
      <Sobre />
    </List>

  );
}



export default function NavMenu() {
  const [openNav, setOpenNav] = useState(false);



  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpenNav(false),
    );
  }, []);

  return (
    <Navbar className="mx-auto max-w-screen-xl px-2 py-1 sticky top-0 z-10 rounded-t-none border-0 shadow-lg
    bg-gray-300 shadow-gray-800
    dark:bg-black dark:shadow-blue-gray-900">
      <div className="flex flex-col col-span-2">
        <div>
          <div className="flex items-center justify-between focus:outline-none active:outline-none
        text-blue-gray-900
        dark:text-gray-300">
            <img className="h-7 md:h-9 opacity-80 dark:opacity-65" src={Logo} alt="" />
            <span className="ms-3">
              <TooltipSocket />
            </span>
            <TooltipUsersOnline />
            <ModeToggle />

            <div className="hidden lg:block">
              <NavList />
            </div>
            <IconButton
              variant="text"
              color="blue-gray"
              className="lg:hidden"
              onClick={() => setOpenNav(!openNav)}
            >

              {openNav ? (
                <XMarkIcon className="h-6 w-6" strokeWidth={2} />
              ) : (
                <Bars3Icon className="h-6 w-6" strokeWidth={2} />
              )}
            </IconButton>
          </div>
          <Collapse open={openNav}>
            <NavList />
          </Collapse>
        </div>
      </div>


    </Navbar>
  )
}