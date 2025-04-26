import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // Importa o hook para verificar autenticação e fazer logout
import { BsPersonCircle, BsGearFill, BsBoxArrowRight } from 'react-icons/bs';
import styles from './Navbar.module.css';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redireciona para login após logout
  };

  return (
    <BootstrapNavbar 
        bg="dark"
        variant="dark"
        expand="lg" 
        className={`${styles.customNavbar} mb-4 shadow-sm`}
    >
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to={isAuthenticated ? "/dashboard" : "/login"}>
          IEQ-Membros
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/membros/novo">Cadastro Membros</Nav.Link>
                <Nav.Link as={Link} to="/membros">Gerenciar Membros</Nav.Link>
                <Nav.Link as={Link} to="/departments">Departamentos</Nav.Link>
                <Nav.Link as={Link} to="/celulas">Células</Nav.Link>
                 {user?.role === 'admin' && (
                    <Nav.Link as={Link} to="/admin/users">Gerenciar Usuários</Nav.Link>
                 )}
              </>
            )}
          </Nav>
          <Nav className="ms-auto">
            {isAuthenticated && user ? (
              <Dropdown align="end"> 
                <Dropdown.Toggle variant="link" id="dropdown-basic" className={`${styles.dropdownToggle} d-flex align-items-center`}>
                  <BsPersonCircle size={24} className="me-2" />
                  {user.username}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    <BsGearFill className="me-2" /> Perfil
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <BsBoxArrowRight className="me-2" /> Sair
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar; 