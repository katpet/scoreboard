package com.carolinarollergirls.scoreboard.core.game;

import com.carolinarollergirls.scoreboard.core.interfaces.BoxSeat;
import com.carolinarollergirls.scoreboard.core.interfaces.BoxTrip;
import com.carolinarollergirls.scoreboard.core.interfaces.Clock;
import com.carolinarollergirls.scoreboard.core.interfaces.Fielding;
import com.carolinarollergirls.scoreboard.core.interfaces.FloorPosition;
import com.carolinarollergirls.scoreboard.core.interfaces.Role;
import com.carolinarollergirls.scoreboard.core.interfaces.Skater;
import com.carolinarollergirls.scoreboard.core.interfaces.Team;
import com.carolinarollergirls.scoreboard.event.Command;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEventProviderImpl;
import com.carolinarollergirls.scoreboard.event.Value;
import com.carolinarollergirls.scoreboard.rules.Rule;
import com.carolinarollergirls.scoreboard.utils.ScoreBoardClock;

public class BoxSeatImpl extends ScoreBoardEventProviderImpl<BoxSeat> implements BoxSeat {
    public BoxSeatImpl(Team t, BoxSeatId id) {
        super(t, t.getId() + "_" + id.toString(), Team.BOX_SEAT);
        boxSeatId = id;
        team = t;
        addProperties(props);
        wallStartTime = 0;
        fpValid = false;
        numPenalties = 1;
        setCopy(BOX_SKATER_PENALTIES, this, SKATER, Skater.PENALTY_COUNT_P2, true);
    }

    @Override
    public String getProviderId() {
        return boxSeatId.toString();
    }

    @Override
    public String getBoxClockId() {
        return "Team" + team.getProviderId() + boxSeatId;
    }

    @Override
    public Clock getBoxClock() {
        return team.getGame().getBoxClock(getBoxClockId());
    }        

    @Override
    public void execute(Command prop, Source source) {
        if (prop == START_BOX) {
            startBox();
        } else if (prop == STOP_BOX) {
            stopBox();
        } else if (prop == RESET_BOX) {
            resetBox();
        }
    }

    @Override
    protected void valueChanged(Value<?> prop, Object value, Object last, Source source, Flag flag) {
        if (prop == BOX_SKATER) {
            setBoxSkater(value.toString());
        } else if (prop == BOX_TIME_CHANGE) {
            Integer secs = (Integer)value;
            setBoxTimeChange(secs.longValue());
            set(BOX_TIME_CHANGE, 0);
        }
    }

    @Override
    public Skater getSkater() {
        return get(SKATER);
    }

    @Override
    public void setSkater(Skater s) {
        set(SKATER, s);
    }

    @Override
    public void startBox() {
        Clock jc = team.getGame().getClock(Clock.ID_JAM);
        if(started()) {
            if(!jc.isRunning()) {
                return;
            }
            // Resume a clock that was paused.
            synchronized (coreLock) {
                Clock pc = getBoxClock();
                if(pc == null) {
                    return;
                }
                pc.start();
            }
        } else {
            if(boxSeatId == BoxSeatId.JAMMER) {
                setFloorPosition(FloorPosition.JAMMER);
            }
            if(hasFloorPosition()) {
                Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();

                Skater s = f.getSkater();
                if(s!= null) {
                    setSkater(s);
                }
        
                if( f != null ) {
                    BoxTrip curTrip = f.getCurrentBoxTrip();
                    if( curTrip == null ) {
                        team.add(Team.BOX_TRIP, new BoxTripImpl(f));

                        Clock pc = getBoxClock();
                        if(pc == null) {
                            return;
                        }
                    }
                }
            }
            restartBox();
            if(!jc.isRunning()) {
                stopBox(); // If jam not running, pause right away
                getBoxClock().resetTime();
            }
        }
    }

    private void doJammerLogic(Clock pc) {
        if(getFloorPosition() != FloorPosition.JAMMER) {
            return;
        }        
        Team otherTeam = (team.getProviderId() == Team.ID_1) ? team.getGame().getTeam(Team.ID_2) : team.getGame().getTeam(Team.ID_1);
        for(BoxSeat bs : otherTeam.getAll(Team.BOX_SEAT)) {
            if(bs.getFloorPosition() == FloorPosition.JAMMER) {
                Clock otherClock = bs.getBoxClock();
                if(otherClock != null && (otherClock.isRunning() || bs.started())) {
                    long penaltyDuration = team.getGame().getLong(Rule.PENALTY_DURATION);
                    long otherMaximum = otherClock.getMaximumTime();
                    long thisMaximum = pc.getMaximumTime();
                    long otherTime = otherClock.getTime();
                    long thisTime = pc.getTime();
                    long otherElapsed2 = otherMaximum - otherTime;
                    long epsilon = 800;
                    if(otherElapsed2 < epsilon) {
                        // This value can end up being not quite zero or even a bit negative, which is undesirable
                        // because then it'll be ignored when we try to set the clock value, so round to 0 when approximately 0.
                        // But, use a small number of milliseconds here to represent zero, because
                        // that will trigger the UI to notice that the clock has changed; it'll still show as 0 seconds.
                        //otherElapsed2 = 1;
                    }
                    long otherNewTime = otherTime;
                    long thisNewTime = thisMaximum;

                    if(otherNewTime >= penaltyDuration || thisNewTime >= penaltyDuration) {
                        // A jammer has multiple penalties.
                        // Cancel extra penalties as far as we can, taking into account how much the other jammer has already served.
                        // Since these times aren't exact, check within some small amount of penalty length.
                        while(otherNewTime >= (penaltyDuration - epsilon) && thisNewTime >= (penaltyDuration - epsilon)) {
                            otherNewTime -= penaltyDuration;
                            thisNewTime -= penaltyDuration;
                            otherMaximum -= penaltyDuration;
                            thisMaximum -= penaltyDuration;
                        }
                    }

                    if(otherMaximum == 0 || thisMaximum == 0) {
                        // If a max reduced to zero above, the values for thisNewTime and otherNewTime are already good
                    } else if(otherMaximum == thisMaximum) {
                        // Simple, common case.
                        // Sitting jammer is released,
                        // and arriving jammer serves as much as sitting jammer did.
                        thisNewTime = otherElapsed2;
                        otherNewTime = 1;
                    } else if(otherMaximum > penaltyDuration && thisMaximum == penaltyDuration) {
                        // This and next case are similar to the simple one above except the max times differ,
                        // so need to account for that in the elapsed time.
                        thisNewTime = otherElapsed2 - (otherMaximum - thisMaximum);
                        otherNewTime = 1;
                    } else if(otherMaximum == penaltyDuration && thisMaximum > penaltyDuration) {
                        thisNewTime = otherElapsed2 + (thisMaximum - otherMaximum);
                        otherNewTime = 1;
                    } else {
                        // The nightmare scenario!
                        // A jammer has returned to the box while
                        // sitting jammer is already serving a reduced single penalty,
                        // so can't reduce that any more.
                        // Sitting jammer must finish their penalty,
                        // and arriving jammer gets regular penalty.
                        otherNewTime = otherTime;
                        thisNewTime = penaltyDuration;
                    }

                    // jigger refresh of clock
                    if(thisNewTime == 0) {
                        thisNewTime = epsilon;
                    }
                    if(thisNewTime == thisTime) {
                        thisNewTime += 1;
                    }
                    pc.setMaximumTime(thisNewTime);
                    pc.setTime(thisNewTime);
                    otherClock.setTime(otherNewTime);
                    pc.restart();                    
                }
                break;
            }
        }
    }

    private void restartBox() {
        synchronized (coreLock)
        {
            Clock pc = getBoxClock();
            if(pc == null) {
                return;
            }
            pc.setCountDirectionDown(true);
            pc.restart();
            setWallStartTime(ScoreBoardClock.getInstance().getCurrentWalltime());
            if(hasFloorPosition()) {
                doJammerLogic(pc);
                Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();
                if( f != null ) {
                    BoxTrip bt = f.getCurrentBoxTrip();
                    if(bt != null) {
                        f.getCurrentBoxTrip().restart();
                    }
                }
            }
        }
    }

    @Override
    public void resetBox() {
        stopBox();        
        synchronized (coreLock) {
            Clock pc = getBoxClock();
            pc.resetTime();
            long penaltyDuration = team.getGame().getLong(Rule.PENALTY_DURATION);
            pc.setMaximumTime(penaltyDuration);
        }
        setWallStartTime(0);
        resetSkater();
    }

    private void resetSkater() {
        if(hasFloorPosition()) {
            Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();
            if( f != null ) {
                BoxTrip curTrip = f.getCurrentBoxTrip();
                if( curTrip != null ) {
                    curTrip.delete(null);
                }
            }
        }
        set(BOX_SKATER_PENALTIES, 0);
        set(BoxSeat.BOX_SKATER, "");
        set(SKATER,null);
        fpValid = false;
    }

    @Override
    public void stopBox() {
        synchronized (coreLock) {
            Clock pc = getBoxClock();
            if(pc == null) {
                return;
            }
            pc.stop();
        }
    }
    @Override
    public void endBox() {
        if(!started()) {
            return;
        }

        synchronized (coreLock) {
            if(hasFloorPosition()) {
                Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();
                if( f != null ) {
                    BoxTrip curTrip = f.getCurrentBoxTrip();
                    if( curTrip != null ) {
                        // Add to penalty count for skater, but only when a jam is running.
                        // Assume trips ending between jams are tests or mistakes, etc.
                        Skater s = getSkater();
                        if( s != null && team.getGame().getClock(Clock.ID_JAM).isRunning()) {
                            int periodNumber = curTrip.getPeriodNumber();
                            curTrip.setPenaltyCount(getCurNumPenalties());
                            int penaltyCount = s.getPenaltyCount(periodNumber);
                            s.setPenaltyCount(periodNumber, penaltyCount + getCurNumPenalties());
                            if(periodNumber == 1) { // Period 2 count will be running total of P1 and P2
                                int penaltyCountP2 = s.getPenaltyCount(2);
                                s.setPenaltyCount(2, penaltyCountP2 + getCurNumPenalties());
                            }
                        }
                        fpValid = false;
                        numPenalties = 1;
                        if(f.getCurrentBoxTrip() != null) {
                            f.getCurrentBoxTrip().end();
                            f.getCurrentBoxTrip().setIsCurrent(false);
                            f.set(Fielding.CURRENT_BOX_TRIP, null);
                        }
                   }
                }
            }
        }
        resetBox();
    }
    @Override
    public void setBoxSkater(String number) {
        if(!started() && !number.equals("") && !number.equals("none")) {
            // When a skater number is selected before start,
            // do a start/stop to trigger adding the box seat,
            // and wait for user to press start.
            startBox();
            stopBox();
        }

        Skater s = findSkater(number);

        if(s == null) {
            resetSkater();
            return;
        }

        setSkater(s);
        // First, remove previous skater's box trip if selection switched skaters
        if(hasFloorPosition()) {
            FloorPosition cur_fp = getFloorPosition();
            Skater cur_s = team.getPosition(cur_fp).getSkater();
            if(cur_s != null) {
                Fielding cur_f = cur_s.getCurrentFielding();
                if(cur_f != null) {
                    if(cur_f.getCurrentBoxTrip() != null) {
                        cur_f.getCurrentBoxTrip().delete();
                    }
                }
            }
        }

        Fielding f = s.getCurrentFielding();
        if(f == null) {
            // If the skater doesn't have a fielding, assume they're a blocker
            // that hasn't been fielded yet. Maybe nobody is doing lineup tracking.
            team.field(s, Role.BLOCKER);
            f = s.getCurrentFielding();
        }
        if(f != null) {
            FloorPosition fpos = f.getPosition().getFloorPosition();
            setFloorPosition(fpos);

            synchronized (coreLock) {
                BoxTrip curTrip = f.getCurrentBoxTrip();
                if( curTrip == null ) {
                    team.add(Team.BOX_TRIP, new BoxTripImpl(f));
                    curTrip = f.getCurrentBoxTrip();
                    curTrip.set(BoxTrip.WALLTIME_START, getWallStartTime());
                }
            }
        }
    }

    @Override
    public void setBoxTimeChange(long secs) {
        Clock bc = getBoxClock();
        long ms = secs*1000;
        long newtime = bc.getTime() + ms;
        long penaltyDuration = team.getGame().getLong(Rule.PENALTY_DURATION);
        long maxtime = bc.getMaximumTime();
        if(newtime > maxtime) {
            bc.setMaximumTime(newtime);
        } else if(newtime <= penaltyDuration) {
            bc.setMaximumTime(penaltyDuration);
        }
        bc.setTime(newtime);

        adjustBoxTripPenaltyCount(ms);
    }

    private void adjustBoxTripPenaltyCount(long amount) {
        // If added time matches penalty duration rule
        // increment or decrement the box trip's penalty count.
        // If box trip doesn't exist yet (skater hasn't been selected yet)
        // do this based on the max time when the the box trip does start.
        long penaltyDuration = team.getGame().getLong(Rule.PENALTY_DURATION);
        if(amount == penaltyDuration || amount == penaltyDuration*(-1)) {
            if(amount < 0) {
                numPenalties -= 1;
            } else {
                numPenalties += 1;
            }
            if(numPenalties < 1)
                numPenalties = 1;
        }
    }

    private void setFloorPosition(FloorPosition f) {
        fp = f;
        fpValid = true;
    }

    private Boolean hasFloorPosition() {
        return fpValid;
    }

    @Override
    public FloorPosition getFloorPosition() {
        return fp;
    }

    private void setWallStartTime(long w) {
        wallStartTime = w;
        set(STARTED, wallStartTime != 0);
    }

    private long getWallStartTime() {
        return wallStartTime;
    }

    private int getCurNumPenalties() {
        return numPenalties;
    }

    private Skater findSkater(String number) {
        Skater s = null;
        if(s == null) {
            // Search through the skaters for ours
            for (Skater sk : team.getAll(Team.SKATER)) {
                if( sk.getRosterNumber().equals(number)) {
                    s = sk;
                    break;
                }
            }
        }
        return s;
    }    

    @Override
    public boolean started() {
        return wallStartTime > 0;
    }

    protected FloorPosition fp;
    protected boolean fpValid;
    protected long wallStartTime;
    protected int numPenalties;

    private BoxSeatId boxSeatId;
    private Team team;
}
