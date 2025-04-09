import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Navigate } from 'react-big-calendar';

const CustomToolbar = ({ label, onNavigate }) => {

    return (
        <div className="d-flex justify-content-between align-items-center mb-3 px-2">
            <div className="d-flex align-items-center">
                <CalendarIcon size={20} className="me-2" />
                <h5 className="m-0">{label}</h5>
            </div>
            <ButtonGroup>
                <Button variant="outline-primary" onClick={() => onNavigate(Navigate.TODAY)}>
                    Today
                </Button>
                <Button variant="outline-secondary" onClick={() => onNavigate(Navigate.PREVIOUS)}>
                    <ChevronLeft size={18} /> Back
                </Button>
                <Button variant="outline-secondary" onClick={() => onNavigate(Navigate.NEXT)}>
                    Next <ChevronRight size={18} />
                </Button>
            </ButtonGroup>
        </div>
    );
};

export default CustomToolbar;