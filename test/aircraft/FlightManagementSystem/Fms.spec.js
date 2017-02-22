import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from '../_mocks/aircraftMocks';

const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
const simpleRouteString = ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route;
const initialRunwayAssignmentMock = '19L';
const isComplexRoute = true;

function buildFmsMock(shouldUseComplexRoute = false) {
    if (shouldUseComplexRoute) {
        const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { route: complexRouteString });

        return new Fms(aircraftPropsMock, initialRunwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
    }

    return new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, initialRunwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
}

function buildFmsMockForDeparture() {
    const fms = buildFmsMock();
    fms.updateModesForDeparture();

    return fms;
}

ava('throws when called without parameters', (t) => {
    t.throws(() => new Fms());
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => buildFmsMock());
    t.notThrows(() => buildFmsMock(isComplexRoute));
});

ava('#currentWaypoint returns the first waypoint of the first leg in the #legCollection', (t) => {
    const fms = buildFmsMock();

    t.true(_isEqual(fms.legCollection[0].waypointCollection[0], fms.currentWaypoint));
});

ava('#currentRoute returns a routeString for a procedure route', (t) => {
    const expectedResult = 'dag.kepec3.klas';
    const fms = buildFmsMock();

    t.true(_isEqual(fms.currentRoute, expectedResult));
});

ava('#currentRoute returns a routeString for a complex route', (t) => {
    const expectedResult = 'cowby..bikkr..dag.kepec3.klas';
    const fms = buildFmsMock(isComplexRoute);

    t.true(_isEqual(fms.currentRoute, expectedResult));
});

ava('#flightPlan returns an empty string when no #_previousRouteSegments exist', (t) => {
    const expectedResult = 'cowby..bikkr..dag.kepec3.klas';
    const fms = buildFmsMock(isComplexRoute);

    t.true(_isEqual(fms.flightPlan, expectedResult));
});

ava('#flightPlan returns a routeString after .nextWaypoint() has been used to move through waypoints', (t) => {
    const expectedResult = 'cowby..bikkr..dag.kepec3.klas';
    const fms = buildFmsMock(isComplexRoute);

    fms.nextWaypoint();
    fms.nextWaypoint();

    t.true(_isEqual(fms.flightPlan, expectedResult));
});

ava('#flightPlan returns a routeString after .skipToWaypoint() has been used to move through waypoints', (t) => {
    const expectedResult = 'cowby..bikkr..dag.kepec3.klas';
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint('dag');

    t.true(_isEqual(fms.flightPlan, expectedResult));
});

ava('#flightPlan returns an empty string when no legs or waypoints exist', (t) => {
    const expectedResult = '';
    const fms = buildFmsMock(isComplexRoute);
    fms._destroyLegCollection();

    t.true(_isEqual(fms.flightPlan, expectedResult));
});

ava('.init() calls ._buildLegCollection()', (t) => {
    const fms = buildFmsMock();
    const _buildLegCollectionSpy = sinon.spy(fms, '_buildLegCollection');

    fms.init(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(_buildLegCollectionSpy.calledWithExactly(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route));
});

ava('.getAltitude() returns the cruise altitude for an aircraft type when no altitudeRestriction or modeController altitude is present', (t) => {
    const expectedResult = 41000;
    const fms = buildFmsMockForDeparture();
    const result = fms.getAltitude();

    t.true(result === expectedResult);
});

ava('.getAltitude() returns the waypoint altitudeRestriction when it doesnt equal -1', (t) => {
    const altitudeRestrictionMock = 10000;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.altitudeRestriction = altitudeRestrictionMock;

    const result = fms.getAltitude();

    t.true(result === altitudeRestrictionMock);
});

ava('.getAltitude() returns the modeController.altitude when _modeController.altitudeMode === hold', (t) => {
    const waypointSpeedRestrictionMock = 10000;
    const mcpAltitudeRestrictionMock = 13000;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.altitudeRestriction = waypointSpeedRestrictionMock;
    fms._modeController.altitudeMode = 'HOLD';
    fms._modeController.altitude = mcpAltitudeRestrictionMock;

    const result = fms.getAltitude();

    t.false(result === waypointSpeedRestrictionMock);
    t.true(result === mcpAltitudeRestrictionMock);
});

ava('.getHeading() returns the waypoint headingRestriction when it doesnt equal -999', (t) => {
    const invalidHeadingMock = -999;
    const fms = buildFmsMockForDeparture();

    const result = fms.getHeading();

    t.true(result === invalidHeadingMock);
});

ava('.getHeading() returns the modeController.altitude when _modeController.altitudeMode === hold', (t) => {
    const headingRestrictionMock = 4.23;
    const mcpHeadingRestrictionMock = 3.42;
    const fms = buildFmsMockForDeparture();
    fms._modeController.headingMode = 'HOLD';
    fms._modeController.heading = mcpHeadingRestrictionMock;

    const result = fms.getHeading();

    t.false(result === headingRestrictionMock);
    t.true(result === mcpHeadingRestrictionMock);
});

ava('.getSpeed() returns the cruise speed for an aircraft type when no speedRestriction or modeController speed is present', (t) => {
    const expectedResult = 460;
    const fms = buildFmsMockForDeparture();
    const result = fms.getSpeed();

    t.true(result === expectedResult);
});

ava('.getSpeed() returns the waypoint speedRestriction when it doesnt equal -1', (t) => {
    const speedRestrictionMock = 230;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.speedRestriction = speedRestrictionMock;

    const result = fms.getSpeed();

    t.true(result === speedRestrictionMock);
});

ava('.getSpeed() returns the modeController.speed when _modeController.speedMode === hold', (t) => {
    const waypointSpeedRestrictionMock = 230;
    const mcpSpeedRestrictionMock = 200;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.speedRestriction = waypointSpeedRestrictionMock;
    fms._modeController.speedMode = 'HOLD';
    fms._modeController.speed = mcpSpeedRestrictionMock;

    const result = fms.getSpeed();

    t.false(result === waypointSpeedRestrictionMock);
    t.true(result === mcpSpeedRestrictionMock);
});

ava('.prependLeg() adds a leg to the beginning of the #legCollection when passed a directRouteString', (t) => {
    const fms = buildFmsMock();

    fms.prependLeg('BIKKR');

    t.true(fms.currentLeg.routeString === 'bikkr');
});

ava('.prependLeg() adds a leg to the beginning of the #legCollection when passed a procedureRouteString', (t) => {
    const fms = buildFmsMock();
    fms.legCollection = [];

    fms.prependLeg('DAG.KEPEC3.KLAS');

    t.true(fms.legCollection.length === 1);
    t.true(fms.legCollection[0].waypointCollection.length === 12);
});

ava('.hasNextWaypoint() returns true if there is a next waypoint', (t) => {
    const fms = buildFmsMock();

    t.true(fms.hasNextWaypoint());
});

ava('.hasNextWaypoint() returns true when the nextWaypoint is part of the nextLeg', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.hasNextWaypoint());
});

ava('.hasNextWaypoint() returns false when no nextWaypoint exists', (t) => {
    const fms = buildFmsMock();
    fms.skipToWaypoint('prino');

    t.false(fms.hasNextWaypoint());
});

ava('.nextWaypoint() adds current LegModel#routeString to _previousRouteSegments before moving to next waypoint', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms.nextWaypoint();

    t.true(fms._previousRouteSegments[0] === 'cowby');
});

ava('.nextWaypoint() calls ._moveToNextLeg() if the current waypointCollection.length === 0', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _moveToNextLegSpy = sinon.spy(fms, '_moveToNextLeg');
    fms.legCollection[0].waypointCollection = [];

    fms.nextWaypoint();

    t.true(_moveToNextLegSpy.calledOnce);
});

ava('.nextWaypoint() calls ._moveToNextWaypointInLeg() if the current waypointCollection.length > 1', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _moveToNextWaypointInLegSpy = sinon.spy(fms, '_moveToNextWaypointInLeg');

    fms.nextWaypoint();

    t.true(_moveToNextWaypointInLegSpy.calledOnce);
});

ava('.nextWaypoint() removes the first LegModel from legCollection when the first Leg has no waypoints', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const length = fms.legCollection.length;
    fms.legCollection[0].waypointCollection = [];

    fms.nextWaypoint();

    t.true(fms.legCollection.length === length - 1);
});

ava('.cancelWaypoint() changes all modes to hold with current getProperty values', (t) => {
    const expectedResult = {
        altitude: 'HOLD',
        autopilot: 'OFF',
        heading: 'HOLD',
        speed: 'HOLD'
    };
    const fms = buildFmsMock(isComplexRoute);

    fms.cancelWaypoint();

    t.true(_isEqual(fms.currentMode, expectedResult));
});

ava('.replaceCurrentFlightPlan() calls ._destroyLegCollection()', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _destroyLegCollectionSpy = sinon.spy(fms, '_destroyLegCollection');

    fms.replaceCurrentFlightPlan(simpleRouteString);

    t.true(_destroyLegCollectionSpy.calledOnce);
});

ava('.replaceCurrentFlightPlan() calls ._buildLegCollection()', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _buildLegCollectionSpy = sinon.spy(fms, '_buildLegCollection');

    fms.replaceCurrentFlightPlan(simpleRouteString);

    t.true(_buildLegCollectionSpy.calledWithExactly(simpleRouteString));
});

ava('.replaceCurrentFlightPlan() creates new LegModels from a routeString and adds them to the #legCollection', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms.replaceCurrentFlightPlan(simpleRouteString);

    t.true(fms.currentLeg._isProcedure);
    t.true(fms.legCollection.length === 1);
    t.true(fms.legCollection[0].waypointCollection.length === 12);
});

ava('.skipToWaypoint() calls ._collectRouteStringsForLegsToBeDropped()', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _collectRouteStringsForLegsToBeDroppedSpy = sinon.spy(fms, '_collectRouteStringsForLegsToBeDropped');

    fms.skipToWaypoint('DAG');

    t.true(_collectRouteStringsForLegsToBeDroppedSpy.calledOnce);
});

ava('.skipToWaypoint() removes all the legs and waypoints in front of the waypoint to skip to', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint('DAG');

    t.true(fms.currentLeg.routeString === 'dag.kepec3.klas');
});

ava('.skipToWaypoint() does nothing is the waypoint to skip to is the #currentWaypoint', (t) => {
    const waypointNameMock = 'cowby';
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint(waypointNameMock);

    t.true(fms.currentLeg.routeString === waypointNameMock);
});

ava('.getNextWaypointPosition() returns the position array for the next Waypoint in the collection', (t) => {
    const expectedResult = [-87.64380662924125, -129.57471627889475];
    const fms = buildFmsMock();
    const result = fms.getNextWaypointPosition();

    t.true(_isEqual(result, expectedResult));
});

ava('._buildLegCollection() returns an array of LegModels', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.legCollection.length === 3);
});

ava('._findLegAndWaypointIndexForWaypointName() returns an object with keys legIndex and waypointIndex', (t) => {
    const expectedResult = {
        legIndex: 2,
        waypointIndex: 0
    };
    const fms = buildFmsMock(isComplexRoute);
    const result = fms._findLegAndWaypointIndexForWaypointName('dag');

    t.true(_isEqual(result, expectedResult));
});

ava('._destroyLegCollection() clears the #legCollection', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms._destroyLegCollection();

    t.true(fms.legCollection.length === 0);
});
