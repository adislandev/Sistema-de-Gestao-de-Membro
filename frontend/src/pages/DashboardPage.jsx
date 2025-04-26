import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getSummaryData } from '../services/api';
import { PersonFill, PeopleFill, Building, House, Diagram3, PersonBadge } from 'react-bootstrap-icons';

function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      setError('');
      try {
        const data = await getSummaryData();
        setSummaryData(data);
      } catch (err) {
        console.error("Erro ao buscar dados do resumo:", err);
        setError('Falha ao carregar os dados do resumo. Tente novamente.');
        setSummaryData(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    if (user) {
      fetchSummary();
    } else if (!authLoading) {
      setLoadingSummary(false);
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  if (!user) {
    return <p>Por favor, faça login para ver o dashboard.</p>;
  }

  const SummaryCard = ({ icon: Icon, title, value, bgColor = 'primary', to = null }) => {
    const isLightBg = bgColor === 'warning' || bgColor === 'light';
    const textColorClass = isLightBg ? 'text-dark' : 'text-white';
    const spinnerVariant = isLightBg ? 'dark' : 'light';

    const cardContent = (
      <Card className={`bg-${bgColor} shadow-sm h-100 ${to ? 'summary-card-link' : ''}`}>
        <Card.Body>
          <Row className="align-items-center h-100">
            <Col xs={3} className="text-center">
              <Icon size={40} className={`${textColorClass} opacity-75`} />
            </Col>
            <Col xs={9} className={textColorClass}>
              <div className="fs-4 fw-bold mb-1">
                {loadingSummary ? <Spinner animation="border" size="sm" variant={spinnerVariant} /> : value ?? 0}
              </div>
              <div className="small text-uppercase">{title}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );

    return (
      <Col md={6} lg={3} className="mb-4">
        {to ? (
          <Link to={to} style={{ textDecoration: 'none' }}>
            {cardContent}
          </Link>
        ) : (
          cardContent
        )}
      </Col>
    );
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Dashboard</h1>
      <p>Bem-vindo(a), {user.username}!</p>

      <hr />

      <h4>Resumo Geral</h4>
      {error && <Alert variant="danger">{error}</Alert>}

      {loadingSummary ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando resumo...</span>
          </Spinner>
        </div>
      ) : summaryData ? (
        <Row>
          <SummaryCard 
            icon={PeopleFill} 
            title="Membros" 
            value={summaryData.totalMembros}
            bgColor="primary"
            to="/membros"
          />
          <SummaryCard 
            icon={Building} 
            title="Departamentos" 
            value={summaryData.totalDepartamentos}
            bgColor="secondary"
            to="/departments"
          />
          <SummaryCard 
            icon={Diagram3} 
            title="Células" 
            value={summaryData.totalCelulas}
            bgColor="warning"
            to="/celulas"
          />
          {user.role === 'admin' && (
            <SummaryCard 
              icon={PersonBadge} 
              title="Usuários" 
              value={summaryData.totalUsuarios}
              bgColor="info"
              to="/admin/users"
            />
          )}
        </Row>
      ) : !error ? (
         <Alert variant="info">Nenhum dado de resumo disponível.</Alert>
      ) : null}

      <style>{`
        .summary-card-link:hover {
          cursor: pointer;
          transform: translateY(-2px);
          transition: transform 0.2s ease-in-out;
        }
      `}</style>

      <Button variant="danger" onClick={logout}>
        Sair
      </Button>
    </div>
  );
}

export default DashboardPage; 