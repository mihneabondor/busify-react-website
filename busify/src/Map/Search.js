import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import {useEffect, useRef, useState} from 'react';
import Badge from 'react-bootstrap/esm/Badge';
import '../Orare/Orar.css'
import CustomSwitch from "../OtherComponents/CustomSwitch";

function Search(props) {
    const searchRef = useRef()
    const [liniiGasite, setLiniiGasite] = useState([])
    const [liniiAdiacente, setLiniiiAdiacente] = useState(true)
    const [sugesttii, setSugesttii] = useState([])

    useEffect(() => {
        if(props.show) {
            const history = localStorage.getItem("search_history")?.trim().split(' ').reverse() || []
            setSugesttii(history)
        }
    }, [props.show])

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

    const search = () => {
        let exista = false;
        const inputValue = searchRef.current?.value?.toUpperCase()?.trim() || '';
        const searchTargets = [...liniiGasite, inputValue].filter(target =>
            target && typeof target === 'string' && target.trim() !== ''
        );

        // Separate 3-digit numbers
        const threeDigitNumbers = searchTargets.filter(target => /^\d{3}$/.test(target));
        const nonThreeDigitTargets = searchTargets.filter(target => !/^\d{3}$/.test(target));

        // ✅ Combine and save to localStorage as "24 43P 25"
        const fullSearch = [...threeDigitNumbers, ...nonThreeDigitTargets];
        if (fullSearch.length) {
            const existingRaw = localStorage.getItem("search_history") || "";
            const existing = existingRaw.split(" ").filter(x => x.trim() !== "");
            const updated = Array.from(new Set([...existing, ...fullSearch])); // remove duplicates
            localStorage.setItem("search_history", updated.join(" "));
        }

        // Store 3-digit numbers separately
        if (threeDigitNumbers.length) {
            exista = true;
            const existing = JSON.parse(localStorage.getItem('special_numbers') || '[]');
            props.foundLabelsRef.current = Array.from(new Set([...existing, ...threeDigitNumbers]));
        }

        setLiniiGasite(nonThreeDigitTargets);

        if (nonThreeDigitTargets.length) {
            if (liniiAdiacente) {
                const patterns = nonThreeDigitTargets
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

                exista = props.unique.current?.some(elem =>
                    patterns.some(pattern => elem?.[0] && pattern.test(elem[0]))
                ) ?? false;
            } else {
                exista = props.unique.current?.some(elem =>
                    nonThreeDigitTargets.includes(elem?.[0])
                ) ?? false;
            }

            if (exista) {
                let oneMatch = false;
                props.unique.current = props.unique.current?.map((elem) =>
                    [elem?.[0], nonThreeDigitTargets.includes(elem?.[0])]
                ) || [];

                if (liniiAdiacente) {
                    const check = (line) => {
                        return nonThreeDigitTargets.some(target => {
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

        if (!exista) {
            props.onHide();
        } else {
            props.onHideSearch();
        }

        setLiniiGasite([]);
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
                <Form.Control placeholder="Ex: 25 43P 253" aria-describedby="desc" onChange={change} ref={searchRef}/>
                {liniiGasite.map((elem, ind) => (
                    <Badge pill bg="secondary" key={ind} style={{marginRight: '10px', cursor: 'pointer'}}
                           onClick={() => removeLine(ind)}>
                        {elem} <small> <b>X</b></small>
                    </Badge>
                ))}
                {sugesttii.length ?
                    <div>
                        <br/>
                        <div>Sugestii</div>
                        <div style={{
                            display: 'flex',
                            overflowY: 'auto'
                        }}>
                            {sugesttii.map((elem) => (
                                <Button variant='undefined'
                                        style={{marginRight: '5px', background: "#B2B2B2", color: 'white'}}
                                        onClick={() => {
                                            searchRef.current.value = elem;
                                            search();
                                        }}>
                                    {elem}
                                </Button>
                            ))}
                        </div>
                    </div>
                    : null}

                <br/>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <CustomSwitch
                        marginLeftAuto="false"
                        checked={liniiAdiacente}
                        onChange={() => setLiniiiAdiacente(!liniiAdiacente)}
                    />
                    Arată liniile adiacente (43 43P 43B)
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="undefined" style={{background: "#B2B2B2", color: "white"}} onClick={() => {
                    props.onHide()
                    setLiniiGasite([])
                }}>
                    Închide
                </Button>
                <Button
                    style={{background: '#8A56A3', color: 'white'}}
                    variant="undefined"
                    onClick={() => {
                        search();
                    }}
                >
                    Caută
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Search;
