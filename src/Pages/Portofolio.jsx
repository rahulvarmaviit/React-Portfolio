import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import SwipeableViews from "react-swipeable-views";
import { useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CardProject from "../components/CardProject";
import TechStackIcon from "../components/TechStackIcon";
import AOS from "aos";
import "aos/dist/aos.css";
import Certificate from "../components/Certificate";
import { Code, Award, Boxes } from "lucide-react";
import ToggleButton from "../components/ToggleButton";

// Static data imports
import { projects, certificates } from "../data/data.js";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  const tabIds = ["projects", "certificates", "tech-stack"];
  return {
    id: `full-width-tab-${tabIds[index]}`,
    "aria-controls": `full-width-tabpanel-${tabIds[index]}`,
  };
}

const techStacks = [
  { icon: "html.svg", language: "HTML" },
  { icon: "css.svg", language: "CSS" },
  { icon: "javascript.svg", language: "JavaScript" },
  { icon: "tailwind.svg", language: "Tailwind CSS" },
  { icon: "reactjs.svg", language: "ReactJS" },
  { icon: "vite.svg", language: "Vite" },
  { icon: "nodejs.svg", language: "Node JS" },
  { icon: "bootstrap.svg", language: "Bootstrap" },
  { icon: "firebase.svg", language: "Firebase" },
  { icon: "MUI.svg", language: "Material UI" },
  { icon: "vercel.svg", language: "Vercel" },
  { icon: "SweetAlert.svg", language: "SweetAlert2" },
];

export default function FullWidthTabs() {
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllCertificates, setShowAllCertificates] = useState(false);
  const isMobile = window.innerWidth < 768;
  const initialItems = isMobile ? 4 : 6;

  // Initialize AOS
  useEffect(() => {
    AOS.init({ once: false });

    // Debounced resize handler
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => AOS.refresh(), 250);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Handle tab change with smooth scrolling
  const handleChange = (event, newValue) => {
    setValue(newValue);

    // Scroll to the corresponding section
    const tabIds = ["projects", "certificates", "tech-stack"];
    const targetId = tabIds[newValue];
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleShowMore = useCallback((type) => {
    if (type === "projects") setShowAllProjects((prev) => !prev);
    else setShowAllCertificates((prev) => !prev);
  }, []);

  const displayedProjects = showAllProjects
    ? projects
    : projects.slice(0, initialItems);
  const displayedCertificates = showAllCertificates
    ? certificates
    : certificates.slice(0, initialItems);

  return (
    <div
      className="md:px-[10%] px-[5%] w-full sm:mt-0 mt-[3rem] bg-[#030014] overflow-hidden"
      id="Portfolio"
    >
      {/* Header Section */}
      <div className="text-center pb-10" data-aos="fade-up">
        <h2 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
          Portfolio Showcase
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base mt-2">
          Explore my journey through projects, certifications, and technical expertise.
        </p>
      </div>

      {/* Tabs Section */}
      <Box sx={{ width: "100%" }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="secondary"
            indicatorColor="secondary"
            variant="fullWidth"
            sx={{
              minHeight: "70px",
              "& .MuiTab-root": {
                fontSize: { xs: "0.9rem", md: "1rem" },
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "none",
                padding: "20px 0",
                margin: "8px",
                borderRadius: "12px",
              },
            }}
          >
            <Tab
              icon={<Code className="mb-2 w-5 h-5" />}
              label="Projects"
              {...a11yProps(0)}
              component="a"
              href="#projects"
            />
            <Tab
              icon={<Award className="mb-2 w-5 h-5" />}
              label="Certificates"
              {...a11yProps(1)}
              component="a"
              href="#certificates"
            />
            <Tab
              icon={<Boxes className="mb-2 w-5 h-5" />}
              label="Tech Stack"
              {...a11yProps(2)}
              component="a"
              href="#tech-stack"
            />
          </Tabs>
        </AppBar>

        {/* Content Panels */}
        <SwipeableViews
          axis={theme.direction === "rtl" ? "x-reverse" : "x"}
          index={value}
          onChangeIndex={(index) => setValue(index)}
        >
          {/* Projects Tab */}
          <TabPanel value={value} index={0} dir={theme.direction} id="projects">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
              {displayedProjects.map((project, index) => (
                <div key={project.id} data-aos="fade-up">
                  <CardProject
                    Img={project.Img}
                    Title={project.Title}
                    Description={project.Description}
                    Link={project.Link}
                    id={project.id}
                  />
                </div>
              ))}
            </div>
            {projects.length > initialItems && (
              <div className="mt-6 flex justify-start">
                <ToggleButton
                  onClick={() => toggleShowMore("projects")}
                  isShowingMore={showAllProjects}
                />
              </div>
            )}
          </TabPanel>

          {/* Certificates Tab */}
          <TabPanel value={value} index={1} dir={theme.direction} id="certificates">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {displayedCertificates.map((cert) => (
                <div key={cert.id} data-aos="fade-up">
                  <Certificate ImgSertif={cert.Img} />
                </div>
              ))}
            </div>
            {certificates.length > initialItems && (
              <div className="mt-6 flex justify-start">
                <ToggleButton
                  onClick={() => toggleShowMore("certificates")}
                  isShowingMore={showAllCertificates}
                />
              </div>
            )}
          </TabPanel>

          {/* Tech Stack Tab */}
          <TabPanel value={value} index={2} dir={theme.direction} id="tech-stack">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {techStacks.map((stack, index) => (
                <div key={index} data-aos="fade-up">
                  <TechStackIcon
                    TechStackIcon={stack.icon}
                    Language={stack.language}
                  />
                </div>
              ))}
            </div>
          </TabPanel>
        </SwipeableViews>
      </Box>
    </div>
  );
}