import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useRef, useState } from 'react';
import Badge from 'react-bootstrap/esm/Badge';
import '../Orare/Orar.css'

function Search(props) {
    const searchRef = useRef()
    const [liniiGasite, setLiniiGasite] = useState([])
    const [liniiAdiacente, setLiniiiAdiacente] = useState(true)

    const change = (e) => {
        e.preventDefault()
        const split = searchRef.current.value.split(' ')

        if(split.length === 2){
            const newLiniiGasite = [...liniiGasite, split[0].toUpperCase()]
            setLiniiGasite(newLiniiGasite)
            searchRef.current.value = split[1]
        }
    }

    const removeLine = (ind) => {
        const newLiniiGasite = liniiGasite.filter((_, index) => index !== ind)
        setLiniiGasite(newLiniiGasite)
    }

    return (
        <Modal centered show={props.show} onHide={() => {
            props.onHide()
            setLiniiGasite([])
        }}>
            <Modal.Header closeButton>
                <Modal.Title>Căutare</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control placeholder="Ex: 25 43" aria-describedby="desc" onChange={change} ref={searchRef} />
                <Form.Text id="desc" muted>
                    Întrodu liniile căutate sau numărele de parc, separate prin câte un spațiu
                </Form.Text>
                {liniiGasite.map((elem, ind) => (
                    <Badge pill bg="secondary" key={ind} style={{marginRight: '10px', cursor: 'pointer'}} onClick={() => removeLine(ind)}>
                        {elem} <small> <b>X</b></small>
                    </Badge>
                ))}
                <br/>
                <Form.Check
                    type="switch"
                    label="Arată liniile adiacente (ex. 43 43P 43B)"
                    id='custom-switch'
                    checked={liniiAdiacente}
                    onChange={() => setLiniiiAdiacente(!liniiAdiacente)}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => {
                    props.onHide()
                    setLiniiGasite([])
                }}>
                    Închide
                </Button>
                <Button style={{background: 'purple'}} variant="primary" onClick={() => {
                    // Get all search targets including the new input value
                    const inputValue = searchRef.current?.value?.toUpperCase()?.trim() || '';
                    const searchTargets = [...liniiGasite, inputValue].filter(target =>
                        target && typeof target === 'string' && target.trim() !== ''
                    );

// Process 3-digit targets first
                    const processedTargets = searchTargets.map(target => {
                        if (/^\d{3}$/.test(target)) {
                            const matchingVehicle = props.vehicles?.find(v => v?.label === target);
                            return matchingVehicle?.line || target;
                        }
                        return target;
                    });

                    setLiniiGasite(processedTargets);

                    let exista = false;
                    if (processedTargets.length) {
                        if (liniiAdiacente) {
                            // Create patterns for all targets
                            const patterns = processedTargets
                                .map(target => {
                                    try {
                                        const escapedStart = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                        return new RegExp(`^${escapedStart}(?:[a-zA-Z]*)$`);
                                    } catch (e) {
                                        console.error('Error creating regex for:', target);
                                        return null;
                                    }
                                })
                                .filter(Boolean);

                            // Check if any element matches any pattern
                            exista = props.unique.current?.some(elem =>
                                patterns.some(pattern => elem?.[0] && pattern.test(elem[0]))
                            ) ?? false;
                        } else {
                            // Simple includes check for all targets
                            exista = props.unique.current?.some(elem =>
                                processedTargets.includes(elem?.[0])
                            ) ?? false;
                        }

                        if (exista) {
                            let oneMatch = false;

                            // First pass - exact matches against all targets
                            props.unique.current = props.unique.current?.map((elem) =>
                                [elem?.[0], processedTargets.includes(elem?.[0])]
                            ) || [];

                            if (liniiAdiacente) {
                                // Second pass - adjacent matches against all targets
                                const check = (line) => {
                                    return processedTargets.some(target => {
                                        if (!target || !line) return false;
                                        try {
                                            const pattern = new RegExp(`^${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[a-zA-Z]*)$`);
                                            return pattern.test(line);
                                        } catch (e) {
                                            console.error('Pattern matching error:', e);
                                            return false;
                                        }
                                    });
                                };

                                props.unique.current = props.unique.current.map(elem =>
                                    [elem?.[0], check(elem?.[0]) || elem?.[1]]
                                );
                            }

                            // Check if we have at least one match
                            oneMatch = props.unique.current.some(elem => elem?.[1]);

                            if (!oneMatch) {
                                props.setShownVehicles?.();
                            } else {
                                props.setShowUndemibusuToast?.();
                            }

                            props.setUniqueLines?.(props.unique.current || []);
                            props.setCheckAllChecked?.(!oneMatch);
                            props.resetMarkers?.();
                        }
                    }

                    props.onHide?.();
                    setLiniiGasite([]);
                }}>
                    Caută
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Search;
