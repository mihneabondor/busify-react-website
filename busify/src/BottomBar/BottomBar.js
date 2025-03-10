import { useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";

const BottomBar = () => {
    const [activeKey, setActiveKey] = useState(0);

    return (
        <Navbar fixed="bottom" className="shadow p-3 bg-white rounded">
            <Container>
                {/* Full-width Nav with evenly spaced links */}
                <Nav
                    className="w-100 d-flex justify-content-between"
                    activeKey={activeKey}
                    onSelect={(selectedKey) => setActiveKey(Number(selectedKey))} // Update active state
                >
                    <Nav.Link eventKey={0} active={activeKey === 0}>Acasă</Nav.Link>
                    <Nav.Link eventKey={1} active={activeKey === 1}>Orare</Nav.Link>
                    <Nav.Link eventKey={2} active={activeKey === 2}>Favorite</Nav.Link>
                    <Nav.Link eventKey={3} active={activeKey === 3}>Știri</Nav.Link>
                    <Nav.Link eventKey={4} active={activeKey === 4}>Setări</Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
};

export default BottomBar;
